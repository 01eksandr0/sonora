import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js'
import type { UserWithProfileEntity } from '../users/users.service.js'
import { PlayTrackDto } from './dto/play-track.dto.js'
import { SeekTrackDto } from './dto/seek-track.dto.js'
import { PlayerEventDto } from './dto/player-event.dto.js'
import { PlayerService } from './player.service.js'

@ApiTags('Player')
@ApiBearerAuth()
@Controller('player')
@UseGuards(JwtAuthGuard)
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get('state')
  @ApiOperation({ summary: 'Get current player session state' })
  getState(@CurrentUser() user: UserWithProfileEntity) {
    return this.playerService.getState(user.id)
  }

  @Post('play')
  @ApiOperation({ summary: 'Play track with optional context' })
  play(@CurrentUser() user: UserWithProfileEntity, @Body() body: PlayTrackDto) {
    return this.playerService.play(user.id, body.trackId, body.context)
  }

  @Post('pause')
  @ApiOperation({ summary: 'Pause playback' })
  pause(@CurrentUser() user: UserWithProfileEntity) {
    return this.playerService.pause(user.id)
  }

  @Post('resume')
  @ApiOperation({ summary: 'Resume playback' })
  resume(@CurrentUser() user: UserWithProfileEntity) {
    return this.playerService.resume(user.id)
  }

  @Post('next')
  @ApiOperation({ summary: 'Skip to next track in queue' })
  next(@CurrentUser() user: UserWithProfileEntity) {
    return this.playerService.next(user.id)
  }

  @Post('previous')
  @ApiOperation({ summary: 'Go back to previous track in history or restart' })
  previous(@CurrentUser() user: UserWithProfileEntity) {
    return this.playerService.previous(user.id)
  }

  @Post('seek')
  @ApiOperation({ summary: 'Seek playback position' })
  seek(@CurrentUser() user: UserWithProfileEntity, @Body() body: SeekTrackDto) {
    return this.playerService.seek(user.id, body.positionSec)
  }

  @Post('event')
  @ApiOperation({ summary: 'Emit playback milestone event' })
  async emitEvent(@CurrentUser() user: UserWithProfileEntity, @Body() body: PlayerEventDto) {
    await this.playerService.emitEvent(user.id, body.trackId, body.event, body.durationSec)
    return { success: true }
  }
}
