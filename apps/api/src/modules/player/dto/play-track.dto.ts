import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { PlayerContext } from '@music-app/shared-types'

export class PlayerContextDto implements PlayerContext {
  @ApiProperty({ enum: ['search', 'artist', 'album', 'playlist', 'collection'] })
  @IsString()
  @IsNotEmpty()
  type!: 'search' | 'artist' | 'album' | 'playlist' | 'collection'

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  id?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  query?: string
}

export class PlayTrackDto {
  @ApiProperty({ description: 'Deezer track provider ID' })
  @IsString()
  @IsNotEmpty()
  trackId!: string

  @ApiPropertyOptional({ type: PlayerContextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlayerContextDto)
  context?: PlayerContextDto
}
