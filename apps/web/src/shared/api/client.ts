import { createApiClient } from '@music-app/api-client'
import { env } from '@/shared/config/env'

export const api = createApiClient({ baseUrl: env.apiUrl })
