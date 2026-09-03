import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, ScrollText, Sparkles, Sun, Orbit, Clock, Users, FileText, ChevronRight, type LucideIcon } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import { tap } from '@/utils/haptics';
import { useLanguage } from '@/contexts/LanguageContext';

// Data-driven hub of "Other Features". Add a new object here to surface a new
// feature card; set `route` for an active feature, or `comingSoon: true` to
// render a muted, non-tappable placeholder.
interface FeatureItem {
  key: string;
  titleKey: string;
  subtitleKey: string;
  icon: LucideIcon;
  route?: Href;
  comingSoon?: boolean;
}

const FEATURES: FeatureItem[] = [
  {
    key: 'panchang',
    titleKey: 'more.panchangTitle',
    subtitleKey: 'more.panchangSub',
    icon: Sun,
    route: '/panchang' as Href,
  },
  {
    key: 'reports',
    titleKey: 'reports.title',
    subtitleKey: 'more.reportsSub',
    icon: FileText,
    route: '/reports' as Href,
  },
  {
    key: 'kundli-matching',
    titleKey: 'more.matchTitle',
    subtitleKey: 'more.matchSub',
    icon: Heart,
    route: '/match',
  },
  {
    key: 'vedic-kundli',
    titleKey: 'more.kundliTitle',
    subtitleKey: 'more.kundliSub',
    icon: Sparkles,
    route: '/kundli' as Href,
  },
  {
    key: 'sade-sati',
    titleKey: 'nav.sadeSati',
    subtitleKey: 'more.sadeSatiSub',
    icon: Orbit,
    route: '/sade-sati' as Href,
  },
  {
    key: 'dasha',
    titleKey: 'nav.dasha',
    subtitleKey: 'more.dashaSub',
    icon: Clock,
    route: '/dasha' as Href,
  },
  {
    key: 'saved-charts',
    titleKey: 'charts.title',
    subtitleKey: 'more.chartsSub',
    icon: Users,
    route: '/charts' as Href,
  },
  {
    key: 'tarot-reading',
    titleKey: 'more.tarotTitle',
    subtitleKey: 'more.tarotSub',
    icon: ScrollText,
    route: '/tarot' as Href,
  },
];

export default function More() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>{t('more.title')}</Text>
        <Text style={styles.subtitle}>{t('more.subtitle')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 88 }]}
        showsVerticalScrollIndicator={false}
      >
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          const disabled = feature.comingSoon || !feature.route;
          const title = t(feature.titleKey);
          const subtitle = t(feature.subtitleKey);

          return (
            <TouchableOpacity
              key={feature.key}
              style={[styles.card, disabled && styles.cardDisabled]}
              activeOpacity={0.85}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={disabled ? t('more.comingSoonA11y', { title }) : t('more.openA11y', { title })}
              onPress={() => {
                if (disabled || !feature.route) return;
                tap();
                router.push(feature.route);
              }}
            >
              <View style={[styles.cardIcon, disabled && styles.cardIconDisabled]}>
                <Icon size={22} color={disabled ? '#8B88A0' : '#E8C87E'} />
              </View>
              <View style={styles.cardTextWrap}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, disabled && styles.cardTitleDisabled]}>
                    {title}
                  </Text>
                  {disabled && (
                    <View style={styles.soonPill}>
                      <Text style={styles.soonPillText}>{t('more.soon')}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSubtitle}>{subtitle}</Text>
              </View>
              {!disabled && <ChevronRight size={20} color="#8B88A0" />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    borderRadius: 16,
    padding: 16,
  },
  cardDisabled: {
    opacity: 0.55,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(232, 200, 126, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  cardTextWrap: {
    flex: 1,
    gap: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  cardTitleDisabled: {
    color: '#C7C4D6',
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
  },
  soonPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 24,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  soonPillText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#8B88A0',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
