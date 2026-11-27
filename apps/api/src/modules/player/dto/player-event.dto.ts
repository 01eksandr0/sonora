import { IsIn, IsInt, IsNotEmpty, IsString, Min, ValidateIf } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class PlayerEventDto {
  @ApiProperty({ description: 'Deezer track provider ID' })
  @IsString()
  @IsNotEmpty()
  trackId!: string

  @ApiProperty({
    enum: ['started', 'listened_10s', 'completed', 'skipped'],
    description: 'Playback event type',
  })
  @IsIn(['started', 'listened_10s', 'completed', 'skipped'])
  event!: 'started' | 'listened_10s' | 'completed' | 'skipped'

  @ApiProperty({ description: 'Listened duration in seconds', example: 30 })
  @IsInt()
  @Min(0)
  durationSec!: number

  @ApiPropertyOptional({
    description: "Id returned by the 'started' event; required for all other events",
  })
  @ValidateIf((dto: PlayerEventDto) => dto.event !== 'started')
  @IsString()
  @IsNotEmpty()
  playbackId?: string
}
