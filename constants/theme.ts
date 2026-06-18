// Centralized design tokens for the app — "Celestial Minimal" visual style.
// Dark celestial navy + champagne gold + serif headings. Other screens import
// from here so the palette stays consistent.

export const colors = {
  // Brand / accents
  gold: '#E8C87E', // champagne gold accent (replaces the old bright #FFD700)
  coral: '#FF6B6B', // missing / secondary
  amber: '#D9A441', // warm note / warning accent
  green: '#69C779', // present
  purple: '#B49BE6', // Kua (Lo Shu)

  // Text
  text: '#F4F1E8', // primary
  textSecondary: '#C7C4D6', // secondary
  muted: '#7E7B92', // muted
  faint: '#56536A', // faint (inactive tabs etc.)

  // Surfaces — fine hairline borders over lots of negative space
  surface: 'rgba(255, 255, 255, 0.03)',
  surfaceStrong: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.10)',

  // Hairline border colors
  goldHairline: 'rgba(232, 200, 126, 0.25)',
  neutralHairline: 'rgba(255, 255, 255, 0.10)',

  // Gradient stops (dark celestial navy)
  bgStart: '#0B0B1A',
  bgMid: '#0E0B22',
  bgEnd: '#140F2A',
} as const;

// Standard screen background gradient (top -> bottom).
export const gradientColors = ['#0B0B1A', '#0E0B22', '#140F2A'] as const;

// Hairline border tokens (re-exported for convenience).
export const goldHairline = colors.goldHairline;
export const neutralHairline = colors.neutralHairline;

// Spacing scale. Names encode the pixel value for quick reference.
export const spacing = {
  xs4: 4,
  sm8: 8,
  md16: 16,
  lg24: 24,
  xl32: 32,
} as const;

// Corner radii used across cards, pills and inputs.
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 24,
} as const;

// Font family names registered at app startup.
export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  display: 'PlayfairDisplay-Bold',
} as const;

export type AppColors = typeof colors;
