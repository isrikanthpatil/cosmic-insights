import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BrandLogo from '@/components/BrandLogo';

export interface ShareCardData {
  eyebrow?: string;                 // e.g. "Today · 1 Sep" or "Life Path"
  title: string;                    // large heading (sign name / number / score)
  subtitle?: string;                // small line under the title
  body: string;                     // main prediction / description
  chips?: { label: string; value: string }[]; // up to 3 stat chips
}

/**
 * A fixed-size (1080×1350-friendly 4:5) branded card, rendered off-screen and
 * captured to a PNG for sharing to WhatsApp / Instagram / etc. Every card carries
 * the Astropanth mark and astropanth.com so each share is a soft install ad.
 * This file is safe on web (RN + expo-linear-gradient only); it's only ever
 * rasterised on native, where react-native-view-shot captures the ref.
 */
const ShareCard = forwardRef<View, { data: ShareCardData }>(({ data }, ref) => {
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <LinearGradient
        colors={['#0B0B1A', '#0E0B22', '#140F2A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Brand */}
      <View style={styles.brandRow}>
        <BrandLogo size={30} showWordmark={false} />
        <Text style={styles.brand}>
          Astro<Text style={styles.gold}>panth</Text>
        </Text>
      </View>

      {/* Headline block */}
      <View style={styles.center}>
        {!!data.eyebrow && <Text style={styles.eyebrow}>{data.eyebrow.toUpperCase()}</Text>}
        <Text style={styles.title} numberOfLines={2}>{data.title}</Text>
        {!!data.subtitle && <Text style={styles.subtitle} numberOfLines={1}>{data.subtitle}</Text>}
        <View style={styles.rule} />
        <Text style={styles.body} numberOfLines={6}>{data.body}</Text>
      </View>

      {/* Chips */}
      {!!data.chips?.length && (
        <View style={styles.chips}>
          {data.chips.slice(0, 3).map((c, i) => (
            <View key={i} style={styles.chip}>
              <Text style={styles.chipLabel}>{c.label.toUpperCase()}</Text>
              <Text style={styles.chipValue} numberOfLines={1}>{c.value}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Your free Vedic astrology &amp; numerology</Text>
        <Text style={styles.footerUrl}>astropanth.com</Text>
      </View>
    </View>
  );
});

ShareCard.displayName = 'ShareCard';
export default ShareCard;

const GOLD = '#E8C87E';
const styles = StyleSheet.create({
  card: {
    width: 360,
    height: 450,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 26,
    justifyContent: 'space-between',
    backgroundColor: '#0B0B1A',
    borderWidth: 1,
    borderColor: 'rgba(232,200,126,0.20)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spark: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(232,200,126,0.12)',
    borderWidth: 1, borderColor: 'rgba(232,200,126,0.35)',
  },
  sparkGlyph: { color: GOLD, fontSize: 14, lineHeight: 16 },
  brand: { color: '#E8E6F0', fontSize: 17, fontFamily: 'PlayfairDisplay-Bold' },
  gold: { color: GOLD },

  center: { flex: 1, justifyContent: 'center' },
  eyebrow: { color: GOLD, fontSize: 11, letterSpacing: 2, fontFamily: 'Inter-SemiBold', marginBottom: 8 },
  title: { color: '#F3F1F9', fontSize: 34, lineHeight: 38, fontFamily: 'PlayfairDisplay-Bold' },
  subtitle: { color: '#C7C4D6', fontSize: 14, fontFamily: 'Inter-Medium', marginTop: 4 },
  rule: { height: 1, backgroundColor: 'rgba(232,200,126,0.22)', width: 54, marginVertical: 14 },
  body: { color: '#D8D5E4', fontSize: 15, lineHeight: 23, fontFamily: 'Inter-Regular' },

  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(232,200,126,0.14)',
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10,
  },
  chipLabel: { color: '#9A97AD', fontSize: 9, letterSpacing: 1, fontFamily: 'Inter-SemiBold' },
  chipValue: { color: GOLD, fontSize: 14, fontFamily: 'Inter-SemiBold', marginTop: 2 },

  footer: {
    marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 12,
  },
  footerText: { color: '#8E8BA0', fontSize: 11.5, fontFamily: 'Inter-Regular', flexShrink: 1 },
  footerUrl: { color: GOLD, fontSize: 12.5, fontFamily: 'Inter-SemiBold' },
});
