<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { TrackSummary } from '@music-app/shared-types'
import { TrackRow } from '@/entities/track'
import { AlbumCard } from '@/entities/album'
import { useArtist } from '@/features/catalog/model/use-artist.query'
import { usePlayerStore } from '@/features/player'

const route = useRoute()
const playerStore = usePlayerStore()

const artistId = computed(() => String(route.params.id ?? ''))

const { artistQuery, topTracksQuery, albumsQuery } = useArtist(artistId)

const artist = computed(() => artistQuery.data.value)
const topTracks = computed(() => topTracksQuery.data.value)
const albums = computed(() => albumsQuery.data.value)

const isTopTracksPending = computed(() => topTracksQuery.isPending.value)
const isTopTracksError = computed(() => topTracksQuery.isError.value)

const isAlbumsPending = computed(() => albumsQuery.isPending.value)
const isAlbumsError = computed(() => albumsQuery.isError.value)

function onPlayTrack(track: TrackSummary) {
  playerStore.playTrack(track, { type: 'artist', id: artistId.value })
}
</script>

<template>
  <div class="content-wrap section-page">
    <section class="artist-hero">
      <img
        v-if="artist?.images.medium"
        :src="artist.images.medium"
        :alt="artist.name"
        class="artist-image"
      />

      <div class="artist-info">
        <p class="eyebrow accent-text">Artist</p>
        <h1 v-if="artist">{{ artist.name }}</h1>
        <p v-else-if="artistQuery.isPending">Loading artist...</p>
        <p v-else-if="artistQuery.isError">Failed to load artist.</p>

        <p v-if="artist?.fansCount">{{ artist.fansCount.toLocaleString() }} fans</p>
      </div>
    </section>

    <section class="artist-section">
      <h2>Top Tracks</h2>

      <p v-if="isTopTracksPending">Loading tracks...</p>
      <p v-else-if="isTopTracksError">Failed to load tracks.</p>
      <p v-else-if="!topTracks?.items?.length">No tracks found.</p>
      <div v-else>
        <TrackRow
          v-for="track in topTracks.items"
          :key="track.providerId"
          :track="track"
          @play="onPlayTrack(track)"
        />
      </div>
    </section>

    <section class="artist-section">
      <h2>Albums</h2>

      <p v-if="isAlbumsPending">Loading albums...</p>
      <p v-else-if="isAlbumsError">Failed to load albums.</p>
      <p v-else-if="!albums?.items?.length">No albums found.</p>
      <div v-else class="albums-grid">
        <AlbumCard v-for="album in albums.items" :key="album.providerId" :album="album" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.artist-hero {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-bottom: 48px;
}

.artist-image {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 12px 40px rgb(0 0 0 / 30%);
}

.artist-info h1 {
  margin: 8px 0;
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 800;
}

.artist-info p {
  color: var(--sonora-muted);
}

.artist-section {
  margin-bottom: 48px;
}

.artist-section h2 {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 700;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 24px;
}

@media (max-width: 600px) {
  .artist-hero {
    align-items: flex-start;
    flex-direction: column;
    gap: 20px;
  }

  .artist-image {
    width: 160px;
    height: 160px;
  }

  .albums-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
}
</style>
