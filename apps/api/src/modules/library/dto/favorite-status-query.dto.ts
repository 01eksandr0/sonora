import { IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class FavoriteStatusQueryDto {
  @ApiProperty({ description: 'Comma-separated Deezer track IDs', example: '123,456' })
  @IsString()
  @IsNotEmpty()
  ids!: string
}
