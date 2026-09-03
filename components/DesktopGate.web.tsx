import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Pressable, Linking } from 'react-native';
import BrandLogo from '@/components/BrandLogo';
import { useLanguage } from '@/contexts/LanguageContext';

const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.astropanth.cosmicinsights';
const SITE_URL = 'https://astropanth.com';

// Below this width we treat the viewport as a phone/tablet and render the app
// full-screen exactly as on device. At or above it we're on a desktop browser,
// where the mobile layout stretches unattractively — so we frame the live app in
// a phone-sized column and put a short pitch beside it.
const DESKTOP_MIN_WIDTH = 900;

/**
 * Desktop-web presentation. The Astropanth UI is designed for phones; on a wide
 * browser it otherwise stretches edge-to-edge and looks broken. Instead of a
 * separate desktop app, we keep the real, fully-working app but present it inside
 * a centred phone frame on the celestial background, with a "get the app" pitch
 * alongside. On phone-width browsers the app renders normally (children pass
 * straight through).
 */
export default function DesktopGate({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const { t } = useLanguage();

  if (width < DESKTOP_MIN_WIDTH) {
    return <>{children}</>;
  }

  return (
    <View style={styles.page}>
      <View style={styles.pitch}>
        <View style={styles.brandRow}>
          <BrandLogo size={34} showWordmark={false} />
          <Text style={styles.brand}>
            Astro<Text style={styles.brandGold}>panth</Text>
          </Text>
        </View>

        <Text style={styles.headline}>{t('desktop.headline')}</Text>
        <Text style={styles.sub}>
          {t('desktop.pitch')}
        </Text>

        <Pressable style={styles.cta} onPress={() => Linking.openURL(PLAY_URL)}>
          <Text style={styles.ctaText}>{t('desktop.getOnPlay')}</Text>
        </Pressable>

        <Pressable onPress={() => Linking.openURL(SITE_URL)} style={styles.linkWrap}>
          <Text style={styles.link}>{t('desktop.learnMore')}</Text>
        </Pressable>
      </View>

      <View style={styles.phoneCol}>
        <View style={styles.phone}>{children}</View>
        <Text style={styles.caption}>{t('desktop.caption')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0B1A',
    // subtle celestial wash toward the centre
    // @ts-ignore web-only gradient
    backgroundImage:
      'radial-gradient(1200px 700px at 30% 20%, #140F2A 0%, #0E0B22 45%, #0B0B1A 80%)',
    paddingHorizontal: 48,
    gap: 56,
  },
  pitch: { maxWidth: 460, flexShrink: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22 },
  brand: { color: '#E8E6F0', fontSize: 22, fontFamily: 'PlayfairDisplay-Bold' },
  brandGold: { color: '#E8C87E' },
  headline: {
    color: '#E8E6F0', fontSize: 40, lineHeight: 46,
    fontFamily: 'PlayfairDisplay-Bold', marginBottom: 16,
  },
  sub: { color: '#9A97AD', fontSize: 16, lineHeight: 25, marginBottom: 28 },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8C87E',
    paddingHorizontal: 22, paddingVertical: 13, borderRadius: 12,
  },
  ctaText: { color: '#161225', fontSize: 15, fontFamily: 'Inter-SemiBold' },
  linkWrap: { marginTop: 16 },
  link: { color: '#E8C87E', fontSize: 14, fontFamily: 'Inter-Medium' },

  phoneCol: { alignItems: 'center' },
  phone: {
    width: 402,
    height: 844,
    maxHeight: '90%',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#0B0B1A',
    borderWidth: 1,
    borderColor: 'rgba(232,200,126,0.22)',
    // soft lift off the background
    // @ts-ignore web-only shadow
    boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
  },
  caption: { color: '#6E6B80', fontSize: 12.5, marginTop: 14, fontFamily: 'Inter-Regular' },
});
