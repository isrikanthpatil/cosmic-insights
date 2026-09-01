import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles, Hash, Gem, TrendingUp, ChevronRight, type LucideIcon } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import { useAuth } from '@/contexts/AuthContext';
import { tap } from '@/utils/haptics';

const REPORTS: { key: string; href: string; title: string; subtitle: string; icon: LucideIcon }[] = [
  { key: 'astrology', href: '/report?type=astrology', title: 'Astrology Report', subtitle: 'Chart, planets, houses, dasha, remedies', icon: Sparkles },
  { key: 'numerology', href: '/report?type=numerology', title: 'Numerology Report', subtitle: 'Birth, Destiny, Name & Kua numbers + Lo Shu', icon: Hash },
  { key: 'gemstone', href: '/report?type=gemstone', title: 'Gemstone Recommendation', subtitle: 'Your life, lucky & creative stones', icon: Gem },
  { key: 'forecast', href: '/report?type=forecast', title: 'Forecast', subtitle: 'Monthly or yearly — transits, dasha & month-by-month', icon: TrendingUp },
];

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/more');
  };

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Back">
          <ArrowLeft size={24} color="#E8C87E" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      {!user ? (
        <View style={styles.gate}>
          <Sparkles size={40} color="#E8C87E" />
          <Text style={styles.gateTitle}>Sign in to view reports</Text>
          <Text style={styles.gateText}>
            Detailed astrology, numerology, gemstone and forecast reports are available to signed-in members. Sign in or create a free account to generate yours.
          </Text>
          <TouchableOpacity
            style={styles.gateBtn}
            onPress={() => { tap(); router.push('/login'); }}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text style={styles.gateBtnText}>Sign in / Sign up</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Beautifully formatted reports from your birth chart — read them here, or save and share as a PDF.
        </Text>

        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <TouchableOpacity
              key={r.key}
              style={styles.card}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Open ${r.title}`}
              onPress={() => {
                tap();
                router.push(r.href as Href);
              }}
            >
              <View style={styles.cardIcon}><Icon size={22} color="#E8C87E" /></View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{r.title}</Text>
                <Text style={styles.cardSubtitle}>{r.subtitle}</Text>
              </View>
              <ChevronRight size={20} color="#8B88A0" />
            </TouchableOpacity>
          );
        })}

        <Text style={styles.note}>Free to generate. Reports are for guidance and reflection.</Text>
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
