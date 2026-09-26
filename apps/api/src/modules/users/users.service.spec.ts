import { Test, type TestingModule } from '@nestjs/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaService } from '../../infrastructure/database/prisma.service.js'
import { UsersService } from './users.service.js'

describe('UsersService', () => {
  let service: UsersService
  let prismaMock: {
    user: {
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
    }
    $transaction: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cb: (tx: typeof prismaMock) => Promise<unknown>) =>
        cb(prismaMock),
      ),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('finds user by email with normalized lowercase', async () => {
    const mockUser = {
      id: 'uuid-1',
      email: 'user@example.com',
      passwordHash: 'hash',
      onboardingCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: null,
    }
    prismaMock.user.findUnique.mockResolvedValue(mockUser)

    const result = await service.findByEmail('  USER@EXAMPLE.COM ')
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      include: { profile: true },
    })
    expect(result).toEqual(mockUser)
  })

  it('finds user by id', async () => {
    const mockUser = {
      id: 'uuid-1',
      email: 'user@example.com',
      passwordHash: 'hash',
      onboardingCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: null,
    }
    prismaMock.user.findUnique.mockResolvedValue(mockUser)

    const result = await service.findById('uuid-1')
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'uuid-1' },
      include: { profile: true },
    })
    expect(result).toEqual(mockUser)
  })

  it('creates user with profile', async () => {
    const now = new Date()
    const mockCreated = {
      id: 'uuid-1',
      email: 'new@example.com',
      passwordHash: 'hash',
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
      profile: {
        id: 'prof-1',
        userId: 'uuid-1',
        displayName: 'Alex',
        avatarUrl: null,
        createdAt: now,
        updatedAt: now,
      },
    }
    prismaMock.user.create.mockResolvedValue(mockCreated)

    const result = await service.create({
      email: 'New@Example.com',
      passwordHash: 'hash',
      displayName: 'Alex',
    })

    expect(result).toEqual(mockCreated)
    const dto = service.toResponseDto(result)
    expect(dto.id).toBe('uuid-1')
    expect(dto.email).toBe('new@example.com')
    expect(dto.profile?.displayName).toBe('Alex')
    expect((dto as unknown as Record<string, unknown>).passwordHash).toBeUndefined()
  })
})
