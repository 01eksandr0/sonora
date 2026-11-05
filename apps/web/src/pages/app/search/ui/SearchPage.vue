<script setup lang="ts">
import { ref } from 'vue'
import { SonoraInput } from '@/shared/ui'
import { useCatalogSearch } from '@/features/catalog/model/use-catalog-search.query'

const searchQuery = ref('')

const {
  data: searchResults,
  isFetching,
  isError,
} = useCatalogSearch(searchQuery)
</script>

<template>
  <section class="search-page">
    <h1>Search</h1>

    <SonoraInput
      v-model="searchQuery"
      placeholder="Search tracks, albums, artists..."
    />

    <p v-if="searchQuery.trim().length < 2" class="search-hint">
      Enter at least 2 characters to search
    </p>

    <p v-else-if="isFetching" class="search-hint">
      Searching...
    </p>

    <p v-else-if="isError" class="search-hint error">
      Something went wrong. Please try again.
    </p>

    <p v-else-if="searchResults" class="search-hint">
      Found {{ searchResults.tracks.pagination.total }} tracks
    </p>
  </section>
</template>

<style scoped>
.search-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

h1 {
  margin: 0;
  color: var(--sonora-text);
  font-size: 28px;
}

.search-hint {
  margin: 0;
  color: var(--sonora-muted);
  font-size: 13px;
}

.error {
  color: #ee8068;
}
</style>