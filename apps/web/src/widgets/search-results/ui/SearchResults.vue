<script setup lang="ts">
import type {
  TrackSummary,
  ArtistSummary,
  AlbumSummary,
} from '@music-app/shared-types'
import { TrackRow } from '@/entities/track'
import { ArtistCard } from '@/entities/artist'
import { AlbumCard } from '@/entities/album'
import { IconChevronRight } from '@tabler/icons-vue'

type SearchTab = 'all' | 'tracks' | 'artists' | 'albums' | 'playlists'

defineProps<{
  activeTab: SearchTab
  tracks: TrackSummary[]
  artists: ArtistSummary[]
  albums: AlbumSummary[]
  totalTracks: number
  totalArtists: number
  totalAlbums: number
}>()

defineEmits<{
  selectTab: [tab: SearchTab]
  play: [track: TrackSummary]
}>()
</script>

<template>
  <div class="search-results">
    <section
      v-if="(activeTab === 'all' || activeTab === 'tracks') && tracks.length"
      class="section-block"
    >
      <div class="section-heading">
        <h3>Tracks</h3>
        <button
          v-if="activeTab === 'all' && totalTracks > 5"
          type="button"
          @click="$emit('selectTab', 'tracks')"
        >
          See all ({{ totalTracks }}) <IconChevronRight :size="15" />
        </button>
      </div>

      <div class="track-list">
        <TrackRow
          v-for="(track, index) in activeTab === 'all' ? tracks.slice(0, 5) : tracks"
          :key="track.providerId"
          :track="track"
          :index="index"
          @play="$emit('play', $event)"
        />
      </div>
    </section>

    <section
      v-if="(activeTab === 'all' || activeTab === 'artists') && artists.length"
      class="section-block"
    >
      <div class="section-heading">
        <h3>Artists</h3>
        <button
          v-if="activeTab === 'all' && totalArtists > 4"
          type="button"
          @click="$emit('selectTab', 'artists')"
        >
          See all ({{ totalArtists }}) <IconChevronRight :size="15" />
        </button>
      </div>

      <div class="recommend-grid">
        <ArtistCard
          v-for="artist in activeTab === 'all' ? artists.slice(0, 4) : artists"
          :key="artist.providerId"
          :artist="artist"
        />
      </div>
    </section>

    <section
      v-if="(activeTab === 'all' || activeTab === 'albums') && albums.length"
      class="section-block"
    >
      <div class="section-heading">
        <h3>Albums</h3>
        <button
          v-if="activeTab === 'all' && totalAlbums > 4"
          type="button"
          @click="$emit('selectTab', 'albums')"
        >
          See all ({{ totalAlbums }}) <IconChevronRight :size="15" />
        </button>
      </div>

      <div class="recommend-grid">
        <AlbumCard
          v-for="album in activeTab === 'all' ? albums.slice(0, 4) : albums"
          :key="album.providerId"
          :album="album"
        />
      </div>
    </section>

    <p
      v-if="
        (activeTab === 'tracks' && !tracks.length) ||
        (activeTab === 'artists' && !artists.length) ||
        (activeTab === 'albums' && !albums.length) ||
        activeTab === 'playlists'
      "
      class="empty-category"
    >
      No results in this category.
    </p>
  </div>
</template>

<style scoped>
.empty-category {
  color: var(--sonora-muted);
  padding: 32px 0;
  text-align: center;
}
</style>
