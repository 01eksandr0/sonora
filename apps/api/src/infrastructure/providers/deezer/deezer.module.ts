import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MUSIC_PROVIDER } from '../music-provider.interface.js'
import { DeezerHttpClient } from './deezer-http.client.js'
import { DeezerProvider } from './deezer.provider.js'
import { DeezerTokenManager } from './deezer-token.manager.js'

@Module({
  imports: [ConfigModule],
  providers: [
    DeezerTokenManager,
    DeezerHttpClient,
    DeezerProvider,
    {
      provide: MUSIC_PROVIDER,
      useExisting: DeezerProvider,
    },
  ],
  exports: [MUSIC_PROVIDER, DeezerProvider],
})
export class DeezerModule {}
