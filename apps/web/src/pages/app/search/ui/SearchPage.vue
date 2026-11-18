
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { IconChevronRight, IconSearch, IconX } from '@tabler/icons-vue'
import { useCatalogSearch } from '@/features/catalog/model/use-catalog-search.query'
import { useSessionStore } from '@/features/auth'
import { SearchResults } from '@/widgets/search-results'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const searchQuery = ref('')
const activeTab = ref<'all' | 'tracks' | 'artists' | 'albums' | 'playlists'>('all')

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
  () =>
    tracksList.value.length > 0 ||
    artistsList.value.length > 0 ||
    albumsList.value.length > 0,
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
  const full =
    session.user?.profile?.displayName ||
    session.user?.email?.split('@')[0] ||
    'Alex'

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

      <!-- Search Categories -->
      <div class="search-categories">
        <span
          :class="{ 'is-active': activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          All
        </span>

        <span
          :class="{ 'is-active': activeTab === 'tracks' }"
          @click="activeTab = 'tracks'"
        >
          Tracks
        </span>

        <span
          :class="{ 'is-active': activeTab === 'artists' }"
          @click="activeTab = 'artists'"
        >
          Artists
        </span>

        <span
          :class="{ 'is-active': activeTab === 'albums' }"
          @click="activeTab = 'albums'"
        >
          Albums
        </span>

        <span
          :class="{ 'is-active': activeTab === 'playlists' }"
          @click="activeTab = 'playlists'"
        >
          Playlists
        </span>
      </div>

      <!-- Initial State -->
      <template v-if="debouncedQuery.trim().length < 2">
        <div class="section-heading">
          <h3>Browse your taste</h3>

          <button type="button" @click="searchQuery = 'Fresh finds'">
            Recommended
            <IconChevronRight :size="15" />
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
            <div
              :class="['artwork aspect-square rounded-[18px]', item.tone]"
              aria-hidden="true"
            >
              <span class="artwork-shape" />
              <span class="artwork-shape artwork-shape-two" />
            </div>

            <strong>{{ item.title }}</strong>
            <span>Made for {{ userName }}</span>
          </div>
        </div>
      </template>

      <!-- Loading State -->
      <p
        v-else-if="isFetching && !hasAnyResults"
        class="search-hint"
      >
        Searching for "{{ debouncedQuery }}"...
      </p>

      <!-- Error State -->
      <div v-else-if="isError" class="section-empty" role="alert">
        <h2>Something went wrong</h2>
        <p class="error">Could not load search results. Please try again.</p>

        <button
          type="button"
          class="primary-button"
          @click="() => refetch"
        >
          Try again
        </button>
      </div>

      <div v-else-if="hasNoResults" class="section-empty">
        <div class="empty-orbit" aria-hidden="true">
          <span />
          <span />
        </div>

        <h2>Try searching for an artist, album, or track</h2>
        <p>Keep exploring and your collection will grow with you.</p>

        <button
          type="button"
          class="primary-button"
          @click="clearQuery"
        >
          Discover music
          <IconChevronRight :size="15" />
        </button>
      </div>

      <!-- Results View -->
      <SearchResults
        v-else-if="hasAnyResults"
        :active-tab="activeTab"
        :tracks="tracksList"
        :artists="artistsList"
        :albums="albumsList"
        :total-tracks="totalTracks"
        :total-artists="totalArtists"
        :total-albums="totalAlbums"
        @select-tab="activeTab = $event"
      />
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
</style>
