<script setup lang="ts">
import { ref } from 'vue'
import { SonoraInput } from '@/shared/ui'
import { useCatalogSearch } from '@/features/catalog/model/use-catalog-search.query'
import { IconSearch } from '@tabler/icons-vue'

const searchQuery = ref('')

const { data: searchResults, isFetching, isError } = useCatalogSearch(searchQuery)
</script>

<template>
  <main class="search-page">
    <p class="eyebrow">EXPLORE</p>
    <h1>Search the sound</h1>

    <div class="search-box" role="search">
      <SonoraInput v-model="searchQuery" placeholder="What do you want to listen to?">
        <template #prefix>
          <IconSearch :size="20" />
        </template>
      </SonoraInput>
    </div>

    <p v-if="searchQuery.trim().length < 2" class="search-hint">
      Try searching for an artist, album, or track.
    </p>

    <p v-else-if="isFetching" class="search-hint">Searching...</p>

    <p v-else-if="isError" class="search-hint error">Something went wrong. Please try again.</p>

    <p v-else-if="searchResults" class="search-hint">
      Found {{ searchResults.tracks.pagination.total }} tracks
    </p>
  </main>
</template>

<style scoped>
.search-page {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  max-width: 1240px;
  padding: 44px 5vw 60px;
}

.eyebrow {
  color: var(--sonora-accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  margin: 0;
}

h1 {
  margin: 0;
  margin-bottom: 42px;
  color: var(--sonora-text);
  font-size: clamp(38px, 5vw, 68px);
  letter-spacing: -0.07em;
  line-height: 0.95;
}

.search-box {
  background: var(--sonora-surface);
  border: 1px solid #31313a;
  border-radius: 14px;
  color: var(--sonora-muted);
  max-width: 700px;
  padding: 4px 16px;
}

.search-box:focus-within {
  border-color: var(--sonora-accent);
}

.search-box :deep(.input-wrapper) {
  background: transparent;
  border: 0;
}

.search-box :deep(.input-prefix) {
  left: 0;
}

.search-box :deep(input) {
  color: var(--sonora-text);
  font-size: 15px;
}

.search-hint {
  margin: 18px 0 0;
  color: var(--sonora-muted);
  font-size: 12px;
}

.error {
  color: #ee8068;
}

@media (max-width: 640px) {
  .search-page {
    padding: 24px 20px;
  }

  h1 {
    margin-bottom: 34px;
  }
}
</style>
