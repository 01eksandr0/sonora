export const queryKeys = {
  health: ['health'] as const,
  currentUser: ['current-user'] as const,
  catalog: {
    search: (query: string, limit: number, offset: number) =>
      ['catalog', 'search', query, limit, offset] as const,
  },
} as const