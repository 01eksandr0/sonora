import { Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js'
import type { UserWithProfileEntity } from '../users/users.service.js'
import { PaginationQueryDto } from '../catalog/dto/pagination-query.dto.js'
import { FavoriteStatusQueryDto } from './dto/favorite-status-query.dto.js'
import { LibraryService } from './library.service.js'

@ApiTags('Library')
@ApiBearerAuth()
@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post('favorites/tracks/:id')
  @ApiOperation({ summary: 'Add track to favorites' })
  async addFavoriteTrack(
    @CurrentUser() user: UserWithProfileEntity,
    @Param('id') id: string,
  ) {
    const success = await this.libraryService.addFavoriteTrack(user.id, id)
    return { success }
  }

  @Delete('favorites/tracks/:id')
  @ApiOperation({ summary: 'Remove track from favorites' })
  async removeFavoriteTrack(
    @CurrentUser() user: UserWithProfileEntity,
    @Param('id') id: string,
  ) {
    const success = await this.libraryService.removeFavoriteTrack(user.id, id)
    return { success }
  }

  @Get('favorites/tracks/status')
  @ApiOperation({ summary: 'Get favorite status for tracks' })
  getFavoriteStatus(
    @CurrentUser() user: UserWithProfileEntity,
    @Query() query: FavoriteStatusQueryDto,
  ) {
    const ids = query.ids.split(',').map((s) => s.trim()).filter(Boolean)
    return this.libraryService.getFavoriteStatus(user.id, ids)
  }

  @Get('favorites/tracks')
  @ApiOperation({ summary: 'Get favorite tracks list' })
  getFavorites(
    @CurrentUser() user: UserWithProfileEntity,
    @Query() query: PaginationQueryDto,
  ) {
    return this.libraryService.getFavorites(user.id, query.limit, query.offset)
  }
}
