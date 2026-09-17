/** Central registry of TanStack Query keys. Extend per domain. */
export const queryKeys = {
  health: ['health'] as const,
  currentUser: ['current-user'] as const,
} as const
