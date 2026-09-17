import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { HealthService } from './health.service.js'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOkResponse({ description: 'Service and dependencies status' })
  async check() {
    const report = await this.health.check()
    if (report.status !== 'ok') {
      throw new ServiceUnavailableException(report)
    }
    return report
  }
}
