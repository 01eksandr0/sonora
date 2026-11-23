import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { CatalogModule } from '../catalog/catalog.module.js'
import { PlayerController } from './player.controller.js'
import { PlayerService } from './player.service.js'
import { PlayerQueueService } from './player-queue.service.js'

@Module({
  imports: [AuthModule, CatalogModule],
  controllers: [PlayerController],
  providers: [PlayerService, PlayerQueueService],
  exports: [PlayerService],
})
export class PlayerModule {}
