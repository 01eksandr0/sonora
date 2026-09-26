import { Injectable } from '@nestjs/common'
import type { UserWithProfile } from '@music-app/shared-types'
import { PrismaService } from '../../infrastructure/database/prisma.service.js'
import type { User, UserProfile } from '../../generated/prisma/client.js'

export type UserWithProfileEntity = User & { profile: UserProfile | null }

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserWithProfileEntity | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { profile: true },
    })
  }

  async findById(id: string): Promise<UserWithProfileEntity | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    })
  }

  async create(data: {
    email: string
    passwordHash: string
    displayName?: string
  }): Promise<UserWithProfileEntity> {
    const normalizedEmail = data.email.toLowerCase().trim()

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: data.passwordHash,
          profile: {
            create: {
              displayName: data.displayName?.trim() || null,
            },
          },
        },
        include: { profile: true },
      })

      return user
    })
  }

  toResponseDto(user: UserWithProfileEntity): UserWithProfile {
    return {
      id: user.id,
      email: user.email,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      profile: user.profile
        ? {
            id: user.profile.id,
            userId: user.profile.userId,
            displayName: user.profile.displayName,
            avatarUrl: user.profile.avatarUrl,
            createdAt: user.profile.createdAt.toISOString(),
            updatedAt: user.profile.updatedAt.toISOString(),
          }
        : null,
    }
  }
}
