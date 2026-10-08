import type { ZodType } from 'zod'

/**
 * Adapts a Zod schema to a vee-validate compatible validation schema function.
 */
export function toValidationSchema<T>(schema: ZodType<T>) {
  return (values: unknown): Record<string, string> => {
    const result = schema.safeParse(values)
    if (result.success) {
      return {}
    }

    const errors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !errors[field]) {
        errors[field] = issue.message
      }
    }
    return errors
  }
}
