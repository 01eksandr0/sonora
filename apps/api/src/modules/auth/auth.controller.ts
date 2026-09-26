import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import type { AuthResponse, UserWithProfile } from '@music-app/shared-types'
import type { Request, Response } from 'express'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js'
import { UsersService, type UserWithProfileEntity } from '../users/users.service.js'
import { AuthService } from './auth.service.js'
import { AuthResponseDto, UserWithProfileDto } from './dto/auth-response.dto.js'
import { LoginDto } from './dto/login.dto.js'
import { RegisterDto } from './dto/register.dto.js'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({
    type: AuthResponseDto,
    description: 'User registered successfully with auth cookies set',
  })
  @ApiConflictResponse({ description: 'Email is already registered' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.auth.register(dto, res)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'User authenticated successfully with auth cookies set',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.auth.login(dto, res)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh session using refresh token cookie or header' })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Tokens rotated and new cookies set',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const refreshToken =
      (req.cookies as Record<string, string> | undefined)?.['refresh_token'] ??
      (req.headers['x-refresh-token'] as string | undefined) ??
      (req.body as { refreshToken?: string } | undefined)?.refreshToken

    return this.auth.refresh(refreshToken, res)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke session and clear authentication cookies' })
  @ApiOkResponse({ description: 'Session successfully revoked' })
  async logout(
    @CurrentUser() user: UserWithProfileEntity | null,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: boolean }> {
    const refreshToken =
      (req.cookies as Record<string, string> | undefined)?.['refresh_token'] ??
      (req.headers['x-refresh-token'] as string | undefined) ??
      (req.body as { refreshToken?: string } | undefined)?.refreshToken

    return this.auth.logout(user?.id, refreshToken, res)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiOkResponse({
    type: UserWithProfileDto,
    description: 'Current authenticated user profile',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  getMe(@CurrentUser() user: UserWithProfileEntity): UserWithProfile {
    return this.users.toResponseDto(user)
  }
}
