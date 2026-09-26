import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type {
  AuthResponse,
  UserProfile,
  UserWithProfile,
} from '@music-app/shared-types'

export class UserProfileDto implements UserProfile {
  @ApiProperty({ example: 'b561c28c-5ad4-4d83-8a39-fb1d683ebdf5' })
  id!: string

  @ApiProperty({ example: 'a1234567-89ab-cdef-0123-456789abcdef' })
  userId!: string

  @ApiPropertyOptional({ example: 'Alex', nullable: true })
  displayName!: string | null

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', nullable: true })
  avatarUrl!: string | null

  @ApiProperty({ example: '2026-09-20T12:00:00.000Z' })
  createdAt!: string

  @ApiProperty({ example: '2026-09-20T12:00:00.000Z' })
  updatedAt!: string
}

export class UserWithProfileDto implements UserWithProfile {
  @ApiProperty({ example: 'a1234567-89ab-cdef-0123-456789abcdef' })
  id!: string

  @ApiProperty({ example: 'user@example.com' })
  email!: string

  @ApiProperty({ example: false })
  onboardingCompleted!: boolean

  @ApiProperty({ example: '2026-09-20T12:00:00.000Z' })
  createdAt!: string

  @ApiProperty({ example: '2026-09-20T12:00:00.000Z' })
  updatedAt!: string

  @ApiPropertyOptional({ type: () => UserProfileDto, nullable: true })
  profile!: UserProfileDto | null
}

export class AuthResponseDto implements AuthResponse {
  @ApiProperty({ type: () => UserWithProfileDto })
  user!: UserWithProfileDto

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string
}
