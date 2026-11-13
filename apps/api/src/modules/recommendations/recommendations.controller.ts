import { Controller, Get, HttpException, Res, UseGuards } from '@nestjs/common'
import type { RecommendationCollectionResponse } from '@music-app/shared-types'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js'
import type { UserWithProfileEntity } from '../users/users.service.js'
import { RecommendationsService } from './recommendations.service.js'

@ApiTags('Recommendations')
@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('collection')
  @ApiOperation({ summary: 'Get the current user recommendation collection' })
  async getCollection(
    @CurrentUser() user: UserWithProfileEntity,
    @Res({ passthrough: true })
    response: { setHeader: (name: string, value: string) => void },
  ): Promise<RecommendationCollectionResponse> {
    try {
      return await this.recommendationsService.getCollection(user.id)
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === 202) {
        response.setHeader('Retry-After', '2')
      }

      throw error
    }
  }
}
