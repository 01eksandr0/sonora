import { IsInt, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SeekTrackDto {
  @ApiProperty({ description: 'Playback position in seconds', example: 15 })
  @IsInt()
  @Min(0)
  positionSec!: number
}
