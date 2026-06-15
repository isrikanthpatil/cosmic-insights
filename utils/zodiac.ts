// Maps a zodiac sign name to its astrological glyph. Lookup is
// case-insensitive and tolerant of surrounding whitespace.

export const ZODIAC_GLYPHS: Record<string, string> = {
  aries: '♈',       // ♈
  taurus: '♉',      // ♉
  gemini: '♊',      // ♊
  cancer: '♋',      // ♋
  leo: '♌',         // ♌
  virgo: '♍',       // ♍
  libra: '♎',       // ♎
  scorpio: '♏',     // ♏
  sagittarius: '♐', // ♐
  capricorn: '♑',   // ♑
  aquarius: '♒',    // ♒
  pisces: '♓',      // ♓
};

/**
 * Returns the glyph for a sign name, or an empty string if unknown/missing.
 */
export const getZodiacGlyph = (sign?: string | null): string => {
  if (!sign) return '';
  return ZODIAC_GLYPHS[sign.trim().toLowerCase()] ?? '';
};
