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

type SearchTab = 'all' | 'tracks' | 'artists' | 'albums'

const route = useRoute()
const router = useRouter()

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

const tasteRecommendations = [
  { title: 'Night drive', tone: 'art-coral', subtitle: 'Made for you' },
  { title: 'Fresh finds', tone: 'art-olive', subtitle: 'Made for you' },
  { title: 'Deep focus', tone: 'art-blue', subtitle: 'Made for you' },
  { title: 'New releases', tone: 'art-violet', subtitle: 'Made for you' },
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
  <main class="content-wrap section-page search-page">
    <p class="eyebrow accent-text">EXPLORE</p>
    <h1>Search the sound</h1>

    <!-- Search Input -->
    <div class="search-screen">
      <div class="large-search" role="search">
        <IconSearch :size="20" class="search-icon" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="What do you want to listen to?"
          aria-label="Search for music"
          autofocus
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

      <!-- Categories / Filter Tabs -->
      <div v-if="debouncedQuery.trim().length >= 2 && !isError" class="search-categories">
        <button
          type="button"
          :class="{ 'is-active': activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          All
        </button>
        <button
          type="button"
          :class="{ 'is-active': activeTab === 'tracks' }"
          @click="activeTab = 'tracks'"
        >
          Tracks <span v-if="totalTracks">({{ totalTracks }})</span>
        </button>
        <button
          type="button"
          :class="{ 'is-active': activeTab === 'artists' }"
          @click="activeTab = 'artists'"
        >
          Artists <span v-if="totalArtists">({{ totalArtists }})</span>
        </button>
        <button
          type="button"
          :class="{ 'is-active': activeTab === 'albums' }"
          @click="activeTab = 'albums'"
        >
          Albums <span v-if="totalAlbums">({{ totalAlbums }})</span>
        </button>
      </div>

      <!-- Initial State (Query < 2 chars) -->
      <div v-if="debouncedQuery.trim().length < 2" class="initial-browse">
        <div class="section-heading">
          <h3>Browse your taste</h3>
          <button type="button" @click="searchQuery = 'Rock'">
            Recommended <IconChevronRight :size="15" />
          </button>
        </div>
        <div class="recommend-grid">
          <button
            v-for="item in tasteRecommendations"
            :key="item.title"
            type="button"
            class="recommend-card"
            @click="searchQuery = item.title"
          >
            <div class="art-wrap">
              <div :class="['artwork aspect-square', item.tone]">
                <span class="artwork-shape" />
                <span class="artwork-shape artwork-shape-two" />
              </div>
              <span class="card-play"><IconPlayerPlayFilled :size="14" /></span>
            </div>
            <strong>{{ item.title }}</strong>
            <span>{{ item.subtitle }}</span>
          </button>
        </div>
      </div>

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

      <!-- No Results State -->
      <div v-else-if="hasNoResults" class="section-empty">
        <div class="empty-orbit" aria-hidden="true">
          <span />
          <span />
        </div>
        <h2>No results found</h2>
        <p>Keep exploring and your collection will grow with you.</p>
        <button type="button" class="primary-button" @click="clearQuery">
          Clear search <IconChevronRight :size="15" />
        </button>
      </div>

      <!-- Results View -->
      <div v-else-if="hasAnyResults" class="search-results">
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
              <div v-else class="artwork size-11 art-rust"><span class="artwork-shape" /></div>
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
              </div>
              <strong>{{ album.title }}</strong>
              <span>{{ album.artist?.name }}</span>
            </RouterLink>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.search-page {
  display: flex;
  flex-direction: column;
}

.search-screen {
  width: 100%;
}

.large-search {
  position: relative;
}

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

.initial-browse {
  margin-top: 36px;
}
</style>
