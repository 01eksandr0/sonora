import { Module } from '@nestjs/common'
import { DeezerModule } from '../../infrastructure/providers/deezer/deezer.module.js'
import { CatalogController } from './catalog.controller.js'
import { CatalogService } from './catalog.service.js'

@Module({
  imports: [DeezerModule],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
