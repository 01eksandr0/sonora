import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../infrastructure/database/prisma.service.js'
import type {
  CompleteOnboardingRequest,
  OnboardingOptionsResponse,
} from '@music-app/shared-types'

const OPTIONS: OnboardingOptionsResponse = {
  genres: [
    'Alternative',
    'Electronic',
    'Hip-hop',
    'Jazz',
    'Indie',
    'Metal',
    'Pop',
    'Rock',
  ],
  artists: [
    'M83',
    'FKA twigs',
    'Deftones',
    'Arctic Monkeys',
    'Tame Impala',
    'Grimes',
    'Radiohead',
    'Björk',
  ],
  moods: [
    'Energized',
    'Focused',
    'Relaxed',
    'Melancholic',
    'Romantic',
    'Restless',
    'Happy',
    'Dark',
  ],
}

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) { }

  getOptions(): OnboardingOptionsResponse {
    return OPTIONS
  }

  async complete(userId: string, data: CompleteOnboardingRequest) {
    if (
      !data.genres?.length ||
      !data.artists?.length ||
      !data.moods?.length
    ) {
      throw new BadRequestException(
        'Select at least one genre, artist, and mood.',
      )
    }

    const options = this.getOptions()

    if (
      data.genres.some((genre) => !options.genres.includes(genre)) ||
      data.artists.some((artist) => !options.artists.includes(artist)) ||
      data.moods.some((mood) => !options.moods.includes(mood))
    ) {
      throw new BadRequestException('Invalid onboarding selection.')
    }

    await this.prisma.$transaction(async (tx) => {
      const profile = await tx.tasteProfile.upsert({
        where: { userId },
        create: {
          userId,
          moods: data.moods,
        },
        update: {
          moods: data.moods,
        },
      })

      await tx.tasteGenrePreference.deleteMany({
        where: { profileId: profile.id },
      })

      await tx.tasteArtistPreference.deleteMany({
        where: { profileId: profile.id },
      })

      await tx.tasteGenrePreference.createMany({
        data: data.genres.map((genre) => ({
          profileId: profile.id,
          genre,
          weight: 1,
          source: 'ONBOARDING',
        })),
      })

      await tx.tasteArtistPreference.createMany({
        data: data.artists.map((artistName) => ({
          profileId: profile.id,
          artistName,
          weight: 1,
          source: 'ONBOARDING',
        })),
      })

      await tx.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
      })
    })

    return { success: true }
  }
}
