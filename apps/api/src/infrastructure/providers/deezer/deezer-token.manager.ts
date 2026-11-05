
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

interface TokenSlot {
  token: string
  cooldownUntil: number
}

@Injectable()
export class DeezerTokenManager {
  private readonly logger = new Logger(DeezerTokenManager.name)
  private readonly tokens: TokenSlot[] = []
  private currentIndex = 0

  constructor(private readonly config: ConfigService) {
    const raw = this.config.get<string>('DEEZER_API_TOKENS', '')

    const list = [...new Set(
      raw
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean),
    )]

    this.tokens = list.map((token) => ({
      token,
      cooldownUntil: 0,
    }))

    if (this.tokens.length === 0) {
      this.tokens.push({
        token: '',
        cooldownUntil: 0,
      })
    }
  }

  getToken(): string | null {
    const now = Date.now()

    for (let i = 0; i < this.tokens.length; i++) {
      const slot = this.tokens[this.currentIndex]

      this.currentIndex =
        (this.currentIndex + 1) % this.tokens.length

      if (!slot) continue

      if (now >= slot.cooldownUntil) {
        return slot.token
      }
    }

    return null
  }

  markThrottled(token: string): void {
    const slot = this.tokens.find((item) => item.token === token)

    if (!slot) return

    slot.cooldownUntil = Date.now() + 30_000

    this.logger.warn('Deezer token placed on cooldown for 30s.')
  }
}
