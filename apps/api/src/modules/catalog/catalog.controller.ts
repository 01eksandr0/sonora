
import { Controller, Get, Param, Query } from '@nestjs/common'
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import { CatalogService } from './catalog.service.js'
import { SearchQueryDto } from './dto/search-query.dto.js'
import { PaginationQueryDto } from './dto/pagination-query.dto.js'

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) { }

  @Get('search')
  @ApiOperation({ summary: 'Search tracks, albums and artists' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async search(@Query() query: SearchQueryDto) {
    return this.catalogService.search(
      query.q,
      query.limit,
      query.offset,
    )
  }

  @Get('tracks/:id')
  @ApiOperation({ summary: 'Get track details' })
  @ApiParam({ name: 'id', description: 'Deezer track ID' })
  async getTrack(@Param('id') id: string) {
    return this.catalogService.getTrack(id)
  }

  @Get('albums/:id')
  @ApiOperation({ summary: 'Get album details' })
  @ApiParam({ name: 'id', description: 'Deezer album ID' })
  async getAlbum(@Param('id') id: string) {
    return this.catalogService.getAlbum(id)
  }

  @Get('artists/:id/top-tracks')
  @ApiOperation({ summary: 'Get artist top tracks' })
  @ApiParam({ name: 'id', description: 'Deezer artist ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getArtistTopTracks(
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.catalogService.getArtistTopTracks(
      id,
      query.limit,
      query.offset,
    )
  }

  @Get('artists/:id')
  @ApiOperation({ summary: 'Get artist details' })
  @ApiParam({ name: 'id', description: 'Deezer artist ID' })
  async getArtist(@Param('id') id: string) {
    return this.catalogService.getArtist(id)
  }

  @Get('genres')
  @ApiOperation({ summary: 'Get all music genres' })
  async getGenres() {
    return this.catalogService.getGenres()
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get popular tracks, albums and artists' })
  async getCharts() {
    return this.catalogService.getCharts()
  }
}
