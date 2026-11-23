import { IsIn, IsInt, IsNotEmpty, IsString, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

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
}
