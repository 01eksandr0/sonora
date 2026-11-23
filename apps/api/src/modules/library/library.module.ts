import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { CatalogModule } from '../catalog/catalog.module.js'
import { LibraryController } from './library.controller.js'
import { LibraryService } from './library.service.js'

@Module({
  imports: [AuthModule, CatalogModule],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}
