/** External music catalog providers. Only Deezer is implemented for now. */
export const MUSIC_PROVIDERS = ['deezer'] as const

export type MusicProviderName = (typeof MUSIC_PROVIDERS)[number]

/** Reference to an entity inside an external provider catalog. */
export interface ProviderReference {
  provider: MusicProviderName
  providerId: string
}
