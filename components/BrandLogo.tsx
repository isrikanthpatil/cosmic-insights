import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// The Astropanth "sparkle-duo" mark: a large four-point star with a small
// accent star, drawn as vector paths (viewBox 0 0 120 120) so it stays crisp at
// any size and matches the report/marketing/app-icon exactly.
const STAR_MAIN =
  'M54,37 C56.4,54.8 63.2,61.6 81,64 C63.2,66.4 56.4,73.2 54,91 C51.6,73.2 44.8,66.4 27,64 C44.8,61.6 51.6,54.8 54,37 Z';
const STAR_ACCENT =
  'M84,28 C85.1,35.9 88.1,38.9 96,40 C88.1,41.1 85.1,44.1 84,52 C82.9,44.1 79.9,41.1 72,40 C79.9,38.9 82.9,35.9 84,28 Z';

/**
 * The single Astropanth logo lockup used across the whole app: the sparkle-duo
 * mark in a soft gold-bordered rounded square, optionally followed by the
 * "Astropanth" wordmark (with "panth" in gold). This is the ONE brand mark —
 * screens use this instead of ad-hoc lucide `Sparkles` icons or plain
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
  const glyph = Math.round(size * 0.66);
  const wordSize = Math.round(size * 0.72);

  return (
    <View style={[styles.row, style]}>
      <View
        style={[
          styles.mark,
          { width: size, height: size, borderRadius: radius },
        ]}
      >
        <Svg width={glyph} height={glyph} viewBox="0 0 120 120">
          <Path d={STAR_MAIN} fill={GOLD} />
          <Path d={STAR_ACCENT} fill={GOLD} />
        </Svg>
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
