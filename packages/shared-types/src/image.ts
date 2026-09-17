/** Unified image representation; frontend never sees provider-specific naming. */
export interface ImageSet {
  small: string | null
  medium: string | null
  large: string | null
  xl: string | null
}
