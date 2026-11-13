import {Module} from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { RecommendationsController } from './recommendations.controller.js';
import { RecommendationsService } from './recommendations.service.js';

@Module({
  imports: [AuthModule, CatalogModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}