// Centralized design tokens for the app. Mirrors the existing dark + gold
// palette so new components stay visually consistent. Existing screens keep
// their literals; use these tokens for new components and where convenient.

export const colors = {
  // Brand / accents
  gold: '#FFD700',
  coral: '#FF6B6B',

  // Text
  text: '#FFFFFF',
  textSecondary: '#E0E0E0',
  muted: '#B8B8B8',

  // Surfaces (translucent over the gradient)
  surface: 'rgba(255, 255, 255, 0.05)',
  surfaceStrong: 'rgba(255, 255, 255, 0.1)',
  border: 'rgba(255, 255, 255, 0.1)',

  // Gradient stops
  bgStart: '#0F0C29',
  bgMid: '#24243e',
  bgEnd: '#302B63',
} as const;

// The standard screen background gradient (top -> bottom).
export const gradientColors = ['#0F0C29', '#24243e', '#302B63'] as const;

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
