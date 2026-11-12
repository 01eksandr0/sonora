<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { IconArrowUpRight, IconMusic, IconPlayerPlayFilled } from '@tabler/icons-vue'
import { api } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/query-keys'

const collectionQuery = useQuery({
  queryKey: queryKeys.recommendations.collection,
  queryFn: () => api.recommendations.getCollection(),
  retry: false,
  refetchInterval: (query) => {
    const data = query.state.data
    return data && Array.isArray(data.tracks) ? false : 5000
  },
})

const tracks = computed(() => {
  const result = collectionQuery.data.value?.tracks
  return Array.isArray(result) ? result : []
})

const isRefreshing = computed(
  () => Boolean(collectionQuery.data.value) && !Array.isArray(collectionQuery.data.value?.tracks),
)

const featuredTrack = computed(() => tracks.value[0])

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="home-page">
    <div class="home-content">
      <div class="welcome-row">
        <div>
          <p class="eyebrow accent-text">Your personal frequency</p>
          <h1>Made for the way <em>you listen.</em></h1>
        </div>
        <a class="quiet-link" href="#weekly-collection">
          This week's collection
          <IconArrowUpRight :size="15" />
        </a>
      </div>

      <section class="hero-card" aria-label="Weekly collection">
        <div class="hero-copy">
          <p class="eyebrow accent-text">Your weekly collection</p>
          <h2 v-if="featuredTrack">A sound<br /><em>of your own.</em></h2>
          <h2 v-else>Find your<br /><em>next favorite.</em></h2>
          <p class="hero-meta">
            {{ tracks.length }} {{ tracks.length === 1 ? 'track' : 'tracks' }} picked from your
            favorite artists.
          </p>
          <a class="primary-button" href="#weekly-collection">
            Explore your collection
            <IconArrowUpRight :size="16" />
          </a>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="hero-sun" />
          <div class="hero-ring" />
          <div class="hero-ring hero-ring-two" />
          <span class="hero-word">SONORA<br /><i>MADE FOR YOU</i></span>
        </div>
      </section>

      <section id="weekly-collection" class="collection-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Refreshed every week</p>
            <h2>This week for you</h2>
          </div>
          <span v-if="tracks.length" class="track-count">{{ tracks.length }} songs</span>
        </div>

        <div v-if="collectionQuery.isPending.value" class="collection-state" aria-live="polite">
          <span class="loading-indicator" />
          <p>Putting your collection together…</p>
        </div>

        <div v-else-if="collectionQuery.isError.value" class="collection-state" role="alert">
          <p>We couldn't load your collection.</p>
          <button class="quiet-link" type="button" @click="collectionQuery.refetch()">
            Try again
            <IconArrowUpRight :size="15" />
          </button>
        </div>

        <div v-else-if="isRefreshing" class="collection-state" aria-live="polite">
          <span class="loading-indicator" />
          <p>Putting your collection together…</p>
        </div>

        <div v-else-if="tracks.length === 0" class="collection-state">
          <IconMusic :size="24" />
          <p>Your collection will appear here when we find tracks from your selected artists.</p>
        </div>

        <template v-else>
          <div class="recommend-grid">
            <article
              v-for="(track, index) in tracks.slice(0, 4)"
              :key="track.providerId"
              class="recommend-card"
            >
              <div class="art-wrap">
                <div
                  class="artwork"
                  :class="`artwork-tone-${index % 4}`"
                  :style="
                    track.album.cover.medium
                      ? { backgroundImage: `url('${track.album.cover.medium}')` }
                      : undefined
                  "
                >
                  <span class="artwork-shape" />
                  <span class="artwork-shape artwork-shape-two" />
                </div>
                <span class="card-play" aria-hidden="true">
                  <IconPlayerPlayFilled :size="13" />
                </span>
              </div>
              <strong>{{ track.title }}</strong>
              <span>{{ track.artist.name }}</span>
            </article>
          </div>

          <div class="track-list-section">
            <div class="section-heading track-list-heading">
              <h2>Your collection</h2>
              <span>{{ tracks.length }} songs</span>
            </div>
            <div class="track-list">
              <div v-for="(track, index) in tracks" :key="track.providerId" class="track-row">
                <span class="track-number">{{ String(index + 1).padStart(2, '0') }}</span>
                <img
                  v-if="track.album.cover.small"
                  class="track-cover"
                  :src="track.album.cover.small"
                  :alt="`${track.album.title} cover`"
                />
                <div v-else class="track-cover track-cover--empty">
                  <IconMusic :size="16" />
                </div>
                <span class="track-name">
                  <strong>{{ track.title }}</strong>
                  <span>{{ track.artist.name }}</span>
                </span>
                <span class="track-album">{{ track.album.title }}</span>
                <span class="track-duration">{{ formatDuration(track.duration) }}</span>
              </div>
            </div>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  color: var(--sonora-text);
  min-width: 0;
  width: 100%;
}

.home-content {
  margin: 0 auto;
  max-width: 1240px;
  padding: 28px 5vw 60px;
}

.eyebrow {
  color: var(--sonora-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  margin: 0;
  text-transform: uppercase;
}

.accent-text {
  color: var(--sonora-accent);
}

.welcome-row {
  align-items: flex-end;
  display: flex;
  justify-content: space-between;
  margin-bottom: 28px;
}

.welcome-row h1 {
  font-size: clamp(29px, 3vw, 42px);
  letter-spacing: -0.055em;
  line-height: 1;
  margin: 10px 0 0;
}

.welcome-row h1 em,
.hero-copy h2 em {
  color: var(--sonora-accent);
  font-style: normal;
}

.quiet-link {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--sonora-muted);
  display: inline-flex;
  font-size: 11px;
  gap: 8px;
  text-decoration: none;
}

.quiet-link:hover {
  color: var(--sonora-text);
}

.hero-card {
  background: #1a2020;
  border-radius: 20px;
  display: flex;
  height: 300px;
  overflow: hidden;
  position: relative;
}

.hero-copy {
  padding: 42px 48px;
  position: relative;
  z-index: 1;
}

.hero-copy h2 {
  font-size: clamp(40px, 5vw, 69px);
  letter-spacing: -0.075em;
  line-height: 0.91;
  margin: 17px 0 16px;
}

.hero-meta {
  color: #a5aca0;
  font-size: 12px;
  margin: 0 0 23px;
}

.primary-button {
  align-items: center;
  background: var(--sonora-accent);
  border-radius: 999px;
  color: #151810;
  display: inline-flex;
  font-size: 12px;
  font-weight: 700;
  gap: 8px;
  padding: 12px 17px;
  text-decoration: none;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.primary-button:hover {
  background: #e5fc73;
  transform: translateY(-2px);
}

.hero-art {
  background: #314a3a;
  height: 100%;
  margin-left: auto;
  overflow: hidden;
  position: relative;
  width: 47%;
}

.hero-art::before {
  background: var(--sonora-accent);
  border-radius: 50%;
  content: '';
  height: 215px;
  left: 35%;
  opacity: 0.8;
  position: absolute;
  top: 35px;
  width: 215px;
}

.hero-sun {
  background: #ee7754;
  border-radius: 50%;
  height: 155px;
  left: 46%;
  position: absolute;
  top: 67px;
  width: 155px;
  z-index: 1;
}

.hero-ring {
  border: 1px solid rgb(242 241 237 / 45%);
  border-radius: 50%;
  height: 280px;
  left: 21%;
  position: absolute;
  top: 1px;
  width: 280px;
  z-index: 2;
}

.hero-ring-two {
  height: 365px;
  left: 5%;
  top: -42px;
  width: 365px;
}

.hero-word {
  bottom: 31px;
  color: #f3f3e9;
  font-size: 16px;
  font-weight: 700;
  left: 38px;
  letter-spacing: 0.18em;
  line-height: 1.1;
  position: absolute;
  z-index: 3;
}

.hero-word i {
  color: var(--sonora-accent);
  font-size: 8px;
  font-style: normal;
  letter-spacing: 0.25em;
}

.collection-section {
  margin-top: 46px;
}

.section-heading {
  align-items: flex-end;
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-heading h2 {
  font-size: 19px;
  letter-spacing: -0.03em;
  margin: 8px 0 0;
}

.track-count,
.track-list-heading > span {
  color: var(--sonora-muted);
  font-size: 11px;
}

.collection-state {
  align-items: center;
  border: 1px solid #292930;
  border-radius: 14px;
  color: var(--sonora-muted);
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  min-height: 190px;
  padding: 24px;
  text-align: center;
}

.collection-state p {
  font-size: 13px;
  margin: 0;
  max-width: 440px;
}

.loading-indicator {
  animation: spin 0.8s linear infinite;
  border: 2px solid #3a3a42;
  border-top-color: var(--sonora-accent);
  border-radius: 50%;
  height: 24px;
  width: 24px;
}

.recommend-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.recommend-card {
  min-width: 0;
}

.art-wrap {
  aspect-ratio: 1;
  margin-bottom: 12px;
  position: relative;
}

.artwork {
  background-position: center;
  background-size: cover;
  border-radius: 8px;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.artwork-tone-0 {
  background-color: #65333c;
  background-image: linear-gradient(135deg, #d96e5b, #65333c);
}

.artwork-tone-1 {
  background-color: #202b2b;
  background-image: linear-gradient(145deg, #737e42, #202b2b);
}

.artwork-tone-2 {
  background-color: #171f3a;
  background-image: linear-gradient(145deg, #345b85, #171f3a);
}

.artwork-tone-3 {
  background-color: #28233e;
  background-image: linear-gradient(145deg, #80619b, #28233e);
}

.artwork-shape {
  border: 1px solid rgb(255 255 255 / 45%);
  border-radius: 50%;
  height: 75%;
  left: 13%;
  position: absolute;
  top: 12%;
  transform: rotate(35deg);
  width: 75%;
}

.artwork-shape-two {
  border-color: rgb(255 255 255 / 23%);
  height: 50%;
  left: 33%;
  top: 31%;
  width: 50%;
}

.recommend-card strong,
.recommend-card > span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommend-card strong {
  font-size: 13px;
  font-weight: 600;
}

.recommend-card > span {
  color: var(--sonora-muted);
  font-size: 11px;
  margin-top: 5px;
}

.card-play {
  align-items: center;
  background: var(--sonora-accent);
  border-radius: 50%;
  bottom: 12px;
  color: #10130b;
  display: flex;
  height: 32px;
  justify-content: center;
  opacity: 0;
  position: absolute;
  right: 12px;
  transform: translateY(5px);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  width: 32px;
}

.recommend-card:hover .card-play {
  opacity: 1;
  transform: translateY(0);
}

.track-list-section {
  margin-top: 51px;
}

.track-list-heading {
  align-items: center;
  border-bottom: 1px solid #27272e;
  padding-bottom: 14px;
}

.track-list-heading h2 {
  margin: 0;
}

.track-row {
  align-items: center;
  border-bottom: 1px solid #202027;
  color: var(--sonora-text);
  display: grid;
  gap: 15px;
  grid-template-columns: 25px 44px minmax(150px, 1.2fr) minmax(130px, 1fr) 45px;
  padding: 9px 4px;
}

.track-row:hover {
  background: #15151b;
}

.track-number {
  color: #6d6d75;
  font-size: 10px;
  text-align: center;
}

.track-cover {
  border-radius: 4px;
  height: 44px;
  object-fit: cover;
  width: 44px;
}

.track-cover--empty {
  align-items: center;
  background: var(--sonora-card);
  color: var(--sonora-muted);
  display: flex;
  justify-content: center;
}

.track-name {
  min-width: 0;
}

.track-name strong,
.track-name span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-name strong {
  font-size: 12px;
  font-weight: 600;
}

.track-name span,
.track-album,
.track-duration {
  color: var(--sonora-muted);
  font-size: 11px;
}

.track-name span {
  margin-top: 4px;
}

.track-album {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-duration {
  text-align: right;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .home-content {
    padding-inline: 28px;
  }

  .track-album {
    display: none;
  }

  .track-row {
    grid-template-columns: 25px 44px minmax(0, 1fr) 45px;
  }
}

@media (max-width: 640px) {
  .home-content {
    padding: 15px 20px 36px;
  }

  .welcome-row {
    align-items: flex-start;
    display: block;
  }

  .quiet-link {
    margin-top: 15px;
  }

  .hero-card {
    height: 360px;
  }

  .hero-copy {
    padding: 30px 26px;
  }

  .hero-art {
    bottom: 0;
    height: 180px;
    left: 0;
    position: absolute;
    width: 100%;
  }

  .hero-art::before {
    height: 150px;
    left: 49%;
    top: 18px;
    width: 150px;
  }

  .hero-sun {
    height: 105px;
    left: 53%;
    top: 40px;
    width: 105px;
  }

  .hero-ring {
    height: 200px;
    left: 25%;
    top: -15px;
    width: 200px;
  }

  .hero-ring-two {
    height: 260px;
    left: 7%;
    top: -45px;
    width: 260px;
  }

  .hero-word {
    bottom: 19px;
    left: 26px;
  }

  .recommend-grid {
    gap: 13px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .recommend-card:nth-child(n + 3) {
    display: none;
  }

  .collection-section {
    margin-top: 36px;
  }

  .track-row {
    gap: 10px;
    grid-template-columns: 20px 40px minmax(0, 1fr);
  }

  .track-cover {
    height: 40px;
    width: 40px;
  }

  .track-duration {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-indicator {
    animation: none;
  }
}
</style>
