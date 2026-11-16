<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import {
  IconChevronRight,
  IconDots,
  IconPlayerPlayFilled,
  IconSearch,
  IconX,
} from '@tabler/icons-vue'
import { useCatalogSearch } from '@/features/catalog/model/use-catalog-search.query'
import { ROUTE_NAMES } from '@/app/router/routes'
import { useSessionStore } from '@/features/auth'

type SearchTab = 'all' | 'tracks' | 'artists' | 'albums' | 'playlists'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const searchQuery = ref('')
const activeTab = ref<SearchTab>('all')

const debouncedQuery = refDebounced(searchQuery, 300)

const { data: searchResults, isFetching, isError, refetch } = useCatalogSearch(debouncedQuery)

onMounted(() => {
  const initialQuery = route.query.q
  if (typeof initialQuery === 'string' && initialQuery.trim()) {
    searchQuery.value = initialQuery.trim()
  }
})

watch(debouncedQuery, (newQuery) => {
  const trimmed = newQuery.trim()
  if (trimmed) {
    router.replace({ query: { ...route.query, q: trimmed } })
  } else {
    const { q: _q, ...rest } = route.query
    router.replace({ query: rest })
  }
})

const tracksList = computed(() => searchResults.value?.tracks?.items ?? [])
const totalTracks = computed(() => searchResults.value?.tracks?.pagination?.total ?? 0)

const artistsList = computed(() => searchResults.value?.artists?.items ?? [])
const totalArtists = computed(() => searchResults.value?.artists?.pagination?.total ?? 0)

const albumsList = computed(() => searchResults.value?.albums?.items ?? [])
const totalAlbums = computed(() => searchResults.value?.albums?.pagination?.total ?? 0)

const hasAnyResults = computed(
  () => tracksList.value.length > 0 || artistsList.value.length > 0 || albumsList.value.length > 0,
)

const hasNoResults = computed(
  () =>
    debouncedQuery.value.trim().length >= 2 &&
    !isFetching.value &&
    !isError.value &&
    searchResults.value !== undefined &&
    !hasAnyResults.value,
)

const userName = computed(() => {
  const full = session.user?.profile?.displayName || session.user?.email?.split('@')[0] || 'Alex'
  return full.split(/\s+/)[0] || 'Alex'
})

const tasteRecommendations = [
  { title: 'Night drive', tone: 'art-coral' },
  { title: 'Fresh finds', tone: 'art-olive' },
  { title: 'Deep focus', tone: 'art-blue' },
  { title: 'New releases', tone: 'art-violet' },
]

function clearQuery() {
  searchQuery.value = ''
  activeTab.value = 'all'
}

function formatDuration(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="content-wrap section-page">
    <p class="eyebrow accent-text">Explore</p>
    <h1>Search the sound</h1>

    <div class="search-screen">
      <!-- Large Search Input -->
      <div class="large-search" role="search">
        <IconSearch :size="20" class="search-icon" />
        <input
          v-model="searchQuery"
          autofocus
          placeholder="What do you want to listen to?"
          aria-label="Search for music"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="clear-button"
          aria-label="Clear search"
          @click="clearQuery"
        >
          <IconX :size="18" />
        </button>
      </div>

      <!-- Search Categories (Pills) -->
      <div class="search-categories">
        <span :class="{ 'is-active': activeTab === 'all' }" @click="activeTab = 'all'">
          Tracks
        </span>
        <span :class="{ 'is-active': activeTab === 'artists' }" @click="activeTab = 'artists'">
          Artists
        </span>
        <span :class="{ 'is-active': activeTab === 'albums' }" @click="activeTab = 'albums'">
          Albums
        </span>
        <span :class="{ 'is-active': activeTab === 'playlists' }" @click="activeTab = 'playlists'">
          Playlists
        </span>
      </div>

      <!-- Initial State (Browse your taste) -->
      <template v-if="debouncedQuery.trim().length < 2">
        <div class="section-heading">
          <h3>Browse your taste</h3>
          <button type="button" @click="searchQuery = 'Fresh finds'">
            Recommended <IconChevronRight :size="15" />
          </button>
        </div>
        <div class="recommend-grid">
          <div
            v-for="item in tasteRecommendations"
            :key="item.title"
            class="recommend-card cursor-pointer"
            role="button"
            tabindex="0"
            @click="searchQuery = item.title"
          >
            <div :class="['artwork aspect-square rounded-[18px]', item.tone]" aria-hidden="true">
              <span class="artwork-shape" />
              <span class="artwork-shape artwork-shape-two" />
            </div>
            <strong>{{ item.title }}</strong>
            <span>Made for {{ userName }}</span>
          </div>
        </div>
      </template>

      <!-- Loading State -->
      <p v-else-if="isFetching && !hasAnyResults" class="search-hint">
        Searching for "{{ debouncedQuery }}"...
      </p>

      <!-- Error State -->
      <div v-else-if="isError" class="section-empty" role="alert">
        <h2>Something went wrong</h2>
        <p class="error">Could not load search results. Please try again.</p>
        <button type="button" class="primary-button" @click="() => refetch()">Try again</button>
      </div>

      <!-- No Results / Empty State -->
      <div v-else-if="hasNoResults" class="section-empty">
        <div class="empty-orbit" aria-hidden="true">
          <span />
          <span />
        </div>
        <h2>Try searching for an artist, album, or track</h2>
        <p>Keep exploring and your collection will grow with you.</p>
        <button type="button" class="primary-button" @click="clearQuery">
          Discover music <IconChevronRight :size="15" />
        </button>
      </div>

      <!-- Results View -->
      <div v-else-if="hasAnyResults">
        <!-- Tracks Section -->
        <section
          v-if="(activeTab === 'all' || activeTab === 'tracks') && tracksList.length > 0"
          class="section-block"
        >
          <div class="section-heading">
            <h3>Tracks</h3>
            <button
              v-if="activeTab === 'all' && totalTracks > 5"
              type="button"
              @click="activeTab = 'tracks'"
            >
              See all ({{ totalTracks }}) <IconChevronRight :size="15" />
            </button>
          </div>
          <div class="track-list">
            <div
              v-for="(track, index) in activeTab === 'all' ? tracksList.slice(0, 5) : tracksList"
              :key="track.providerId"
              class="track-row"
            >
              <span class="track-number">{{ String(index + 1).padStart(2, '0') }}</span>
              <img
                v-if="track.album?.cover?.small"
                :src="track.album.cover.small || undefined"
                :alt="`${track.album?.title || track.title} cover`"
                class="track-thumb"
              />
              <div v-else class="artwork size-11 art-rust rounded-xl">
                <span class="artwork-shape" />
              </div>
              <span class="track-name">
                <strong>{{ track.title }}</strong>
                <span>{{ track.artist?.name }}</span>
              </span>
              <span class="track-album">{{ track.album?.title }}</span>
              <span class="track-duration">{{ formatDuration(track.duration) }}</span>
              <IconDots class="track-more" :size="17" />
            </div>
          </div>
        </section>

        <!-- Artists Section -->
        <section
          v-if="(activeTab === 'all' || activeTab === 'artists') && artistsList.length > 0"
          class="section-block"
        >
          <div class="section-heading">
            <h3>Artists</h3>
            <button
              v-if="activeTab === 'all' && totalArtists > 4"
              type="button"
              @click="activeTab = 'artists'"
            >
              See all ({{ totalArtists }}) <IconChevronRight :size="15" />
            </button>
          </div>
          <div class="recommend-grid">
            <RouterLink
              v-for="artist in activeTab === 'all' ? artistsList.slice(0, 4) : artistsList"
              :key="artist.providerId"
              :to="{ name: ROUTE_NAMES.artist, params: { id: artist.providerId } }"
              class="recommend-card"
            >
              <div class="art-wrap">
                <img
                  v-if="artist.images?.medium || artist.images?.small"
                  :src="artist.images.medium || artist.images.small || undefined"
                  :alt="artist.name"
                  class="artist-avatar"
                />
                <div v-else class="artwork aspect-square art-olive artist-avatar-fallback">
                  <span class="artwork-shape" />
                </div>
                <span class="card-play"><IconPlayerPlayFilled :size="14" /></span>
              </div>
              <strong>{{ artist.name }}</strong>
              <span>Artist</span>
            </RouterLink>
          </div>
        </section>

        <!-- Albums Section -->
        <section
          v-if="(activeTab === 'all' || activeTab === 'albums') && albumsList.length > 0"
          class="section-block"
        >
          <div class="section-heading">
            <h3>Albums</h3>
            <button
              v-if="activeTab === 'all' && totalAlbums > 4"
              type="button"
              @click="activeTab = 'albums'"
            >
              See all ({{ totalAlbums }}) <IconChevronRight :size="15" />
            </button>
          </div>
          <div class="recommend-grid">
            <RouterLink
              v-for="album in activeTab === 'all' ? albumsList.slice(0, 4) : albumsList"
              :key="album.providerId"
              :to="{ name: ROUTE_NAMES.album, params: { id: album.providerId } }"
              class="recommend-card"
            >
              <div class="art-wrap">
                <img
                  v-if="album.cover?.medium || album.cover?.small"
                  :src="album.cover.medium || album.cover.small || undefined"
                  :alt="album.title"
                  class="album-cover"
                />
                <div v-else class="artwork aspect-square art-blue">
                  <span class="artwork-shape" />
                </div>
                <span class="card-play"><IconPlayerPlayFilled :size="14" /></span>
              </div>
              <strong>{{ album.title }}</strong>
              <span>{{ album.artist?.name }}</span>
            </RouterLink>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-icon {
  flex-shrink: 0;
}

.clear-button {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--sonora-muted);
  cursor: pointer;
  display: flex;
  margin-left: auto;
  padding: 4px;
  transition: color 0.2s ease;
}

.clear-button:hover {
  color: var(--sonora-text);
}

.search-hint {
  color: var(--sonora-muted);
  font-size: 13px;
  margin: 32px 0;
}

.error {
  color: #ee8068;
}

.cursor-pointer {
  cursor: pointer;
}

.track-thumb {
  border-radius: 10px;
  height: 44px;
  object-fit: cover;
  width: 44px;
}

.artist-avatar {
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  display: block;
  object-fit: cover;
  width: 100%;
}

.artist-avatar-fallback {
  border-radius: 50%;
}

.album-cover {
  aspect-ratio: 1 / 1;
  border-radius: 18px;
  display: block;
  object-fit: cover;
  width: 100%;
}
</style>
