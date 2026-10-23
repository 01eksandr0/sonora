import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import type { CompleteOnboardingRequest } from '@music-app/shared-types'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js'
import type { UserWithProfileEntity } from '../users/users.service.js'
import { OnboardingService } from './onboarding.service.js'

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('options')
  getOptions() {
    return this.onboardingService.getOptions()
  }

  @Post()
  complete(
    @CurrentUser() user: UserWithProfileEntity,
    @Body() body: CompleteOnboardingRequest,
  ) {
    return this.onboardingService.complete(user.id, body)
  }
}
