
import { z } from 'zod'

const imageSetSchema = z.object({
  small: z.string().nullable(),
  medium: z.string().nullable(),
  large: z.string().nullable(),
  xl: z.string().nullable(),
})

export const trackSummarySchema = z.object({
  provider: z.literal('deezer'),
  providerId: z.string(),
  title: z.string(),
  titleVersion: z.string().nullable(),
  duration: z.number(),
  previewUrl: z.string().nullable(),
  explicit: z.boolean(),
  artist: z.object({
    provider: z.string(),
    providerId: z.string(),
    name: z.string(),
  }),
  album: z.object({
    provider: z.string(),
    providerId: z.string(),
    title: z.string(),
    cover: imageSetSchema,
  }),
})

export const trackCollectionSchema = z.array(trackSummarySchema).max(50)
