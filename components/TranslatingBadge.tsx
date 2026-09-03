import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslating } from '@/utils/i18nContent';

/**
 * A subtle, non-blocking pill shown at the bottom of the screen while generated
 * content is being translated for the current language (first view of uncached
 * text). It never appears in English and disappears the moment translation
 * settles. Mounted once at the app root so it covers every screen.
 */
export default function TranslatingBadge() {
  const { t, lang } = useLanguage();
  const busy = useTranslating();
  const insets = useSafeAreaInsets();

  if (!busy || lang === 'en') return null;

  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: insets.bottom + 74 }]}>
      <View style={styles.pill}>
        <ActivityIndicator size="small" color="#E8C87E" />
        <Text style={styles.text}>{t('common.translating')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(20,16,36,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(232,200,126,0.35)',
  },
  text: { color: '#F4F1E8', fontSize: 13, fontFamily: 'Inter-Medium' },
});
