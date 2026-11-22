import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  PlayerContext,
  PlayerEventRequest,
  PlayerState,
  TrackSummary,
} from '@music-app/shared-types'
import { api } from '@/shared/api/client'

export const usePlayerStore = defineStore('player', () => {
  const audio = typeof Audio !== 'undefined' ? new Audio() : ({} as HTMLAudioElement)

  const currentTrack = ref<TrackSummary | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(30) // Preview is 30s
  const volume = ref(70) // 0 - 100
  const isMuted = ref(false)
  const isLiked = ref(false)
  const history = ref<TrackSummary[]>([])
  const queue = ref<TrackSummary[]>([])
  const context = ref<PlayerContext | null>(null)
  const isBuffering = ref(false)
  // Bumped by every track switch; responses from older switches are dropped so they can't override the newer track.
  let switchSeq = 0
  let initialized = false
  // Track ids for which the lifecycle events were already sent during the current listen.
  let startedReportedFor: string | null = null
  let tenSecReportedFor: string | null = null

  // Progress percentage (0 - 100)
  const progressPercent = computed(() => {
    if (!duration.value || duration.value === 0) return 0
    return Math.min(100, Math.max(0, (currentTime.value / duration.value) * 100))
  })

  // Audio listeners setup
  if (typeof audio.addEventListener === 'function') {
    audio.addEventListener('timeupdate', () => {
      currentTime.value = audio.currentTime
      if (audio.duration && !Number.isNaN(audio.duration) && audio.duration > 0) {
        duration.value = audio.duration
      }
      const id = currentTrack.value?.providerId
      if (id && audio.currentTime >= 10 && tenSecReportedFor !== id) {
        tenSecReportedFor = id
        report('listened_10s', 10)
      }
    })

    audio.addEventListener('ended', async () => {
      report('completed', audio.duration || duration.value)
      await advance()
    })

    audio.addEventListener('play', () => {
      isPlaying.value = true
    })

    audio.addEventListener('pause', () => {
      isPlaying.value = false
    })

    audio.addEventListener('waiting', () => {
      isBuffering.value = true
    })

    audio.addEventListener('playing', () => {
      isBuffering.value = false
      const id = currentTrack.value?.providerId
      if (id && startedReportedFor !== id) {
        startedReportedFor = id
        tenSecReportedFor = null
        report('started', 0)
      }
    })

    audio.addEventListener('error', () => {
      isBuffering.value = false
      isPlaying.value = false
      // Signed Deezer preview URLs expire; if the server already gave a fresher one, retry with it.
      retryWithServerUrl()
    })
  }

  // Fire-and-forget: analytics must never block or break playback.
  function report(event: PlayerEventRequest['event'], seconds: number) {
    const trackId = currentTrack.value?.providerId
    if (!trackId) return
    api.player
      .emitEvent({ trackId, event, durationSec: Math.max(0, Math.round(seconds)) })
      .catch(() => {})
  }

  // User leaves a track before it ended.
  function reportSkip() {
    if (currentTrack.value && startedReportedFor === currentTrack.value.providerId && !audio.ended) {
      report('skipped', audio.currentTime)
    }
    startedReportedFor = null
  }

  function retryWithServerUrl() {
    const url = currentTrack.value?.previewUrl
    if (!audio.error || !url || audio.src === url) return
    audio.src = url
    audio.play().catch(() => {})
  }

  function applyServerState(state: PlayerState) {
    currentTrack.value = state.currentTrack
    history.value = state.history || []
    queue.value = state.queue || []
    context.value = state.context ?? null
    isLiked.value = !!state.isLiked
  }

  async function initFromBackend() {
    if (initialized) return
    initialized = true
    const seq = switchSeq
    try {
      const state = await api.player.getState()
      // User already started something while state was loading: keep it.
      if (seq !== switchSeq || currentTrack.value) return
      applyServerState(state)
      if (state.currentTrack?.previewUrl) {
        audio.src = state.currentTrack.previewUrl
        audio.currentTime = (state.progressMs || 0) / 1000
        currentTime.value = audio.currentTime
      }
    } catch {
      // ignore initialization error if unauthorized
    }
  }

  async function playTrack(track: TrackSummary, ctx?: PlayerContext) {
    const seq = ++switchSeq
    reportSkip()
    // 1. Immediately update local UI state
    currentTrack.value = track
    currentTime.value = 0

    // 2. Start audio playback immediately if previewUrl is available.
    // Triggering play() directly inside the user gesture preserves browser autoplay permission
    // and eliminates any latency caused by the backend round-trip.
    const initialUrl = track.previewUrl
    if (initialUrl) {
      try {
        if (audio.src !== initialUrl) {
          audio.src = initialUrl
          audio.load()
        }
        audio.currentTime = 0
        audio.volume = isMuted.value ? 0 : volume.value / 100
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[Player] Initial playback prevented or interrupted:', err)
          })
        }
      } catch (err) {
        console.warn('[Player] Audio initial play failed:', err)
      }
    }

    // 3. Concurrently notify backend to register play, queue, history, and favorites
    try {
      const res = await api.player.play({ trackId: track.providerId, context: ctx })
      if (seq !== switchSeq) return
      applyServerState(res)

      // Only fall back to the server URL when the clicked track had none: Deezer signs preview URLs
      // per request, so they always differ and swapping would restart the song.
      const serverUrl = res.currentTrack?.previewUrl
      if (!initialUrl && serverUrl) {
        audio.src = serverUrl
        audio.currentTime = 0
        audio.volume = isMuted.value ? 0 : volume.value / 100
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise.catch(() => {})
        }
      } else {
        // Local URL may have already failed before the server answered.
        retryWithServerUrl()
      }
    } catch (err) {
      console.warn('[Player] Backend play sync failed, continuing local playback:', err)
    }
  }

  async function togglePlay() {
    if (!currentTrack.value) return

    if (isPlaying.value) {
      audio.pause()
      try {
        await api.player.pause()
      } catch {
        // ignore
      }
    } else {
      try {
        if (!audio.src && currentTrack.value.previewUrl) {
          audio.src = currentTrack.value.previewUrl
          audio.currentTime = currentTime.value
        }
        audio.volume = isMuted.value ? 0 : volume.value / 100
        await audio.play()
        await api.player.resume()
      } catch {
        // ignore
      }
    }
  }

  async function next() {
    reportSkip()
    await advance()
  }

  async function advance() {
    startedReportedFor = null
    const seq = ++switchSeq
    try {
      const res = await api.player.next()
      if (seq !== switchSeq) return
      applyServerState(res)

      if (res.currentTrack?.previewUrl) {
        audio.src = res.currentTrack.previewUrl
        audio.currentTime = 0
        currentTime.value = 0
        audio.volume = isMuted.value ? 0 : volume.value / 100
        await audio.play().catch(() => {})
      } else {
        audio.pause()
        audio.currentTime = 0
        currentTime.value = 0
      }
    } catch {
      if (seq === switchSeq) audio.pause()
    }
  }

  async function previous() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0
      currentTime.value = 0
      try {
        await api.player.seek({ positionSec: 0 })
      } catch {
        // ignore
      }
      return
    }

    reportSkip()
    const seq = ++switchSeq
    try {
      const res = await api.player.previous()
      if (seq !== switchSeq) return
      applyServerState(res)

      if (res.currentTrack?.previewUrl) {
        audio.src = res.currentTrack.previewUrl
        audio.currentTime = 0
        currentTime.value = 0
        audio.volume = isMuted.value ? 0 : volume.value / 100
        await audio.play().catch(() => {})
      } else {
        audio.currentTime = 0
        currentTime.value = 0
      }
    } catch {
      if (seq !== switchSeq) return
      audio.currentTime = 0
      currentTime.value = 0
    }
  }

  function seek(seconds: number) {
    const clamped = Math.max(0, Math.min(duration.value, seconds))
    audio.currentTime = clamped
    currentTime.value = clamped
    api.player.seek({ positionSec: Math.floor(clamped) }).catch(() => {})
  }

  function setVolume(val: number) {
    const clamped = Math.max(0, Math.min(100, val))
    volume.value = clamped
    isMuted.value = false
    audio.volume = clamped / 100
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    audio.volume = isMuted.value ? 0 : volume.value / 100
  }

  async function toggleLike() {
    if (!currentTrack.value) return
    const id = currentTrack.value.providerId
    const newLiked = !isLiked.value

    isLiked.value = newLiked
    try {
      if (newLiked) {
        await api.library.addFavoriteTrack(id)
      } else {
        await api.library.removeFavoriteTrack(id)
      }
    } catch {
      // revert on failure
      isLiked.value = !newLiked
    }
  }

  return {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLiked,
    history,
    queue,
    context,
    isBuffering,
    progressPercent,
    initFromBackend,
    playTrack,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleLike,
  }
})
