
import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DeezerTokenManager } from './deezer-token.manager.js'

interface DeezerApiError {
  error?: {
    code?: number
    message?: string
    type?: string
  }
}

@Injectable()
export class DeezerHttpClient {
  private readonly logger = new Logger(DeezerHttpClient.name)
  private readonly baseUrl: string

  constructor(
    private readonly config: ConfigService,
    private readonly tokenManager: DeezerTokenManager,
  ) {
    this.baseUrl = this.config.get<string>(
      'DEEZER_API_URL',
      'https://api.deezer.com',
    )
  }

  async get<T>(
    path: string,
    params: Record<string, string | number | boolean | undefined> = {},
  ): Promise<T> {
    const maxRetries = 3

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const token = this.tokenManager.getToken()

      if (token === null) {
        throw new ServiceUnavailableException(
          'All Deezer tokens are temporarily unavailable.',
        )
      }

      const url = new URL(
        path.startsWith('/') ? path.slice(1) : path,
        `${this.baseUrl.replace(/\/+$/, '')}/`,
      )

      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value))
        }
      }

      if (token) {
        url.searchParams.set('access_token', token)
      }

      let res: Response

      try {
        res = await fetch(url.toString(), {
  headers: {
    Accept: 'application/json',
  },
  signal: AbortSignal.timeout(5000),
})
      } catch (err) {
        this.logger.error(
          `Network error on attempt ${attempt}/${maxRetries}: ${err instanceof Error ? err.message : String(err)
          }`,
        )

        if (attempt === maxRetries) {
          throw new ServiceUnavailableException(
            'Catalog is temporarily unavailable.',
          )
        }

        continue
      }

      let data: unknown

      try {
        data = await res.json()
      } catch {
        throw new ServiceUnavailableException(
          'Deezer returned an invalid response.',
        )
      }

      const apiError = data as DeezerApiError

      if (apiError?.error?.code === 800) {
        throw new NotFoundException(
          'Requested catalog item was not found.',
        )
      }

      if (apiError?.error?.code === 4 || res.status === 429) {
        this.tokenManager.markThrottled(token)

        this.logger.warn(
          `Rate limit on attempt ${attempt}/${maxRetries}. Retrying with next token...`,
        )

        continue
      }

      if (!res.ok || apiError?.error) {
        this.logger.error(
          `Deezer API error: ${apiError?.error?.message || res.statusText
          }`,
        )

        throw new ServiceUnavailableException(
          'Catalog is temporarily unavailable.',
        )
      }

      return data as T
    }

    throw new ServiceUnavailableException(
      'Deezer rate limit exceeded. Please try again shortly.',
    )
  }
}
