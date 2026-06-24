import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Heart, ScrollText, Sparkles, ChevronRight, type LucideIcon } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import { tap } from '@/utils/haptics';

// Data-driven hub of "Other Features". Add a new object here to surface a new
// feature card; set `route` for an active feature, or `comingSoon: true` to
// render a muted, non-tappable placeholder.
interface FeatureItem {
  key: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  route?: Href;
  comingSoon?: boolean;
}

const FEATURES: FeatureItem[] = [
  {
    key: 'kundli-matching',
    title: 'Kundli Matching',
    subtitle: 'Compatibility · Ashtakoota Guna Milan',
    icon: Heart,
    route: '/match',
  },
  {
    key: 'vedic-kundli',
    title: 'Full Vedic Kundli',
    subtitle: 'Planets, houses & dashas — coming soon',
    icon: Sparkles,
    comingSoon: true,
  },
  {
    key: 'tarot-reading',
    title: 'Tarot Reading',
    subtitle: 'Coming soon',
    icon: ScrollText,
    comingSoon: true,
  },
];

export default function More() {
  const router = useRouter();

  return (
    <ScreenBackground style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Other Features</Text>
        <Text style={styles.subtitle}>More ways to explore your cosmic blueprint</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          const disabled = feature.comingSoon || !feature.route;

          return (
            <TouchableOpacity
              key={feature.key}
              style={[styles.card, disabled && styles.cardDisabled]}
              activeOpacity={0.85}
              disabled={disabled}
              onPress={() => {
                if (disabled || !feature.route) return;
                tap();
                router.push(feature.route);
              }}
            >
              <View style={[styles.cardIcon, disabled && styles.cardIconDisabled]}>
                <Icon size={22} color={disabled ? '#7E7B92' : '#E8C87E'} />
              </View>
              <View style={styles.cardTextWrap}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, disabled && styles.cardTitleDisabled]}>
                    {feature.title}
                  </Text>
                  {disabled && (
                    <View style={styles.soonPill}>
                      <Text style={styles.soonPillText}>Soon</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSubtitle}>{feature.subtitle}</Text>
              </View>
              {!disabled && <ChevronRight size={20} color="#7E7B92" />}
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
    paddingHorizontal: 20,
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
    color: '#7E7B92',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
