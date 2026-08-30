import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles, Hash, Gem, ChevronRight, type LucideIcon } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import { tap } from '@/utils/haptics';
import { ReportType } from '@/utils/reports/reportHtml';

const REPORTS: { type: ReportType; title: string; subtitle: string; icon: LucideIcon }[] = [
  { type: 'astrology', title: 'Astrology Report', subtitle: 'Chart, planets, houses, dasha, remedies', icon: Sparkles },
  { type: 'numerology', title: 'Numerology Report', subtitle: 'Birth, Destiny & Kua numbers + Lo Shu grid', icon: Hash },
  { type: 'gemstone', title: 'Gemstone Recommendation', subtitle: 'Your life, lucky & creative stones', icon: Gem },
];

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Beautifully formatted reports from your birth chart — read them here, or save and share as a PDF.
        </Text>

        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <TouchableOpacity
              key={r.type}
              style={styles.card}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Open ${r.title}`}
              onPress={() => {
                tap();
                router.push(`/report?type=${r.type}` as Href);
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
});
