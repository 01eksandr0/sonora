export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `API request failed with status ${status}`)
    this.name = 'ApiError'
  }
}

export interface HttpClientOptions {
  baseUrl: string
  fetch?: typeof fetch
  /** Send cookies (needed for HttpOnly JWT cookies). Defaults to 'include'. */
  credentials?: RequestCredentials
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>

export interface RequestOptions {
  query?: QueryParams
  body?: unknown
  signal?: AbortSignal
  headers?: Record<string, string>
}

export class HttpClient {
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch
  private readonly credentials: RequestCredentials

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis)
    this.credentials = options.credentials ?? 'include'
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>('GET', path, options)
  }

  post<T>(path: string, options?: RequestOptions) {
    return this.request<T>('POST', path, options)
  }

  put<T>(path: string, options?: RequestOptions) {
    return this.request<T>('PUT', path, options)
  }

  patch<T>(path: string, options?: RequestOptions) {
    return this.request<T>('PATCH', path, options)
  }

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>('DELETE', path, options)
  }

  async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.query)
    const headers: Record<string, string> = { Accept: 'application/json', ...options.headers }
    let body: string | undefined

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(options.body)
    }

    const response = await this.fetchImpl(url, {
      method,
      headers,
      body,
      credentials: this.credentials,
      signal: options.signal,
    })

    const payload = await this.parseBody(response)

    if (!response.ok) {
      throw new ApiError(response.status, payload)
    }

    return payload as T
  }

  private buildUrl(path: string, query?: QueryParams): string {
    const url = new URL(`${this.baseUrl}/${path.replace(/^\//, '')}`)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value))
        }
      }
    }
    return url.toString()
  }

  private async parseBody(response: Response): Promise<unknown> {
    if (response.status === 204) return undefined
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return response.json()
    }
    const text = await response.text()
    return text.length ? text : undefined
  }
}
