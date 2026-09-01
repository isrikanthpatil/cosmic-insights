import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';

/**
 * The single Astropanth logo lockup used across the whole app: a ✦ four-point
 * star in a soft gold-bordered rounded square, optionally followed by the
 * "Astropanth" wordmark (with "panth" in gold). This is the ONE brand mark —
 * screens should use this instead of ad-hoc lucide `Sparkles` icons or plain
 * "Astropanth" text so the logo never drifts. See BRAND_STANDARD.md.
 */
export default function BrandLogo({
  size = 28,
  showWordmark = true,
  suffix,
  style,
}: {
  size?: number;
  showWordmark?: boolean;
  suffix?: string; // e.g. "Plus" -> "Astropanth Plus"
  style?: StyleProp<ViewStyle>;
}) {
  const radius = Math.round(size * 0.3);
  const glyph = Math.round(size * 0.56);
  const wordSize = Math.round(size * 0.72);

  return (
    <View style={[styles.row, style]}>
      <View
        style={[
          styles.mark,
          { width: size, height: size, borderRadius: radius },
        ]}
      >
        <Text style={[styles.glyph, { fontSize: glyph, lineHeight: glyph + 2 }]}>✦</Text>
      </View>
      {showWordmark && (
        <Text style={[styles.word, { fontSize: wordSize }]}>
          Astro<Text style={styles.gold}>panth</Text>
          {suffix ? <Text style={styles.suffix}>{` ${suffix}`}</Text> : null}
        </Text>
      )}
    </View>
  );
}

const GOLD = '#E8C87E';
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232,200,126,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,200,126,0.35)',
  },
  glyph: { color: GOLD },
  word: { color: '#E8E6F0', fontFamily: 'PlayfairDisplay-Bold' },
  gold: { color: GOLD },
  suffix: { color: '#C7C4D6' },
});
