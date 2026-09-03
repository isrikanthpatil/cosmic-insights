import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles, Hash, Gem, TrendingUp, ChevronRight, type LucideIcon } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { REPORTS_REQUIRE_ENTITLEMENT } from '@/constants/plans';
import { useLanguage } from '@/contexts/LanguageContext';
import { tap } from '@/utils/haptics';

const REPORTS: { key: string; href: string; titleKey: string; subKey: string; icon: LucideIcon }[] = [
  { key: 'astrology', href: '/report?type=astrology', titleKey: 'reports.astrologyTitle', subKey: 'reports.astrologySub', icon: Sparkles },
  { key: 'numerology', href: '/report?type=numerology', titleKey: 'reports.numerologyTitle', subKey: 'reports.numerologySub', icon: Hash },
  { key: 'gemstone', href: '/report?type=gemstone', titleKey: 'reports.gemstoneTitle', subKey: 'reports.gemstoneSub', icon: Gem },
  { key: 'forecast', href: '/report?type=forecast', titleKey: 'reports.forecastTitle', subKey: 'reports.forecastSub', icon: TrendingUp },
];

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { hasReports } = usePremium();
  const { t } = useLanguage();
  const locked = REPORTS_REQUIRE_ENTITLEMENT && !hasReports;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/more');
  };

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <ArrowLeft size={24} color="#E8C87E" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t('reports.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {!user ? (
        <View style={styles.gate}>
          <Sparkles size={40} color="#E8C87E" />
          <Text style={styles.gateTitle}>{t('report.signInTitle')}</Text>
          <Text style={styles.gateText}>
            {t('reports.signInBody')}
          </Text>
          <TouchableOpacity
            style={styles.gateBtn}
            onPress={() => { tap(); router.push('/login'); }}
            accessibilityRole="button"
            accessibilityLabel={t('common.signIn')}
          >
            <Text style={styles.gateBtnText}>{t('common.signInUp')}</Text>
          </TouchableOpacity>
        </View>
      ) : locked ? (
        <View style={styles.gate}>
          <Sparkles size={40} color="#E8C87E" />
          <Text style={styles.gateTitle}>{t('report.unlockTitle')}</Text>
          <Text style={styles.gateText}>
            {t('reports.unlockBody')}
          </Text>
          <TouchableOpacity
            style={styles.gateBtn}
            onPress={() => { tap(); router.push('/premium'); }}
            accessibilityRole="button"
            accessibilityLabel={t('common.unlock')}
          >
            <Text style={styles.gateBtnText}>{t('common.unlock')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>{t('reports.intro')}</Text>

        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <TouchableOpacity
              key={r.key}
              style={styles.card}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t(r.titleKey)}
              onPress={() => {
                tap();
                router.push(r.href as Href);
              }}
            >
              <View style={styles.cardIcon}><Icon size={22} color="#E8C87E" /></View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{t(r.titleKey)}</Text>
                <Text style={styles.cardSubtitle}>{t(r.subKey)}</Text>
              </View>
              <ChevronRight size={20} color="#8B88A0" />
            </TouchableOpacity>
          );
        })}

        <Text style={styles.note}>{t('reports.note')}</Text>
      </ScrollView>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  topTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  intro: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#C7C4D6', lineHeight: 20, marginBottom: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(232,200,126,0.25)',
    borderRadius: 16, padding: 16, marginBottom: 12,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(232,200,126,0.08)', borderWidth: 1, borderColor: 'rgba(232,200,126,0.25)',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  cardSubtitle: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#C7C4D6', marginTop: 2 },
  note: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#8B88A0', textAlign: 'center', marginTop: 8 },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  gateTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  gateText: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#8B88A0', textAlign: 'center', lineHeight: 20 },
  gateBtn: { marginTop: 18, backgroundColor: '#E8C87E', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  gateBtnText: { color: '#161225', fontSize: 15, fontFamily: 'Inter-SemiBold' },
});
