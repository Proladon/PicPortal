/** Parse `#rgb`, `#rrggbb(aa)` and `rgb()/rgba()` strings into [r, g, b]. */
const parseColor = (color: string): [number, number, number] | null => {
  const value = color.trim().toLowerCase()
  const hex = value.match(/^#([0-9a-f]{3,8})$/)
  if (hex) {
    let digits = hex[1]
    if (digits.length === 3 || digits.length === 4)
      digits = [...digits.slice(0, 3)].map((d) => d + d).join('')
    if (digits.length < 6) return null
    return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16)) as [
      number,
      number,
      number
    ]
  }
  const rgb = value.match(/^rgba?\(([^)]+)\)$/)
  if (rgb) {
    const parts = rgb[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .slice(0, 3)
      .map(Number)
    if (parts.length === 3 && parts.every((n) => Number.isFinite(n)))
      return parts as [number, number, number]
  }
  return null
}

/** Pick a readable text color for the given background (or undefined if unknown). */
export const readableTextColor = (background?: string): string | undefined => {
  if (!background) return undefined
  const rgb = parseColor(background)
  if (!rgb) return undefined
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.45 ? '#09090b' : '#fafafa'
}

/** Inline style for a portal colored chip. */
export const portalChipStyle = (portal: { bg?: string; fg?: string }) => {
  if (!portal.bg) return undefined
  return {
    backgroundColor: portal.bg,
    borderColor: portal.bg,
    color: portal.fg || readableTextColor(portal.bg),
  }
}
