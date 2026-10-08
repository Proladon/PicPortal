/** Accent palettes, persisted as `settings.general.theme`. */
export const accentThemes = [
  { value: 'picportal', swatch: 'oklch(0.79 0.06 215)' },
  { value: 'naive', swatch: 'oklch(0.83 0.13 167)' },
  { value: 'zinc', swatch: 'oklch(0.705 0.015 286.067)' },
  { value: 'violet', swatch: 'oklch(0.606 0.25 292.717)' },
  { value: 'rose', swatch: 'oklch(0.645 0.246 16.439)' },
  { value: 'amber', swatch: 'oklch(0.705 0.213 47.604)' },
] as const

export type AccentTheme = (typeof accentThemes)[number]['value']
export const defaultAccentTheme: AccentTheme = 'picportal'

/** Color scheme, persisted as `settings.general.appearance`. */
export const appearances = ['dark', 'light', 'system'] as const
export type Appearance = (typeof appearances)[number]
export const defaultAppearance: Appearance = 'dark'

export const isAccentTheme = (value: unknown): value is AccentTheme =>
  accentThemes.some((theme) => theme.value === value)

export const isAppearance = (value: unknown): value is Appearance =>
  appearances.includes(value as Appearance)
