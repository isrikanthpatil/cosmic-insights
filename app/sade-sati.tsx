import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Orbit } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import { useChart } from '@/contexts/ChartContext';
import { getCoordinatesForPlace } from '@/utils/astrology';
import { computeEphemeris } from '@/utils/jyotish/ephemeris';
import { computeSadeSati, SadeSatiPhase } from '@/utils/jyotish/sadeSati';

const PHASES: SadeSatiPhase[] = ['Rising', 'Peak', 'Setting'];

export default function SadeSatiScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeProfile: profile } = useChart();

  const result = useMemo(() => {
    if (!profile?.dateOfBirth) return null;
    try {
      const coords = getCoordinatesForPlace(profile.placeOfBirth) ?? { latitude: 22, longitude: 79 };
      const eph = computeEphemeris({
        dateOfBirth: profile.dateOfBirth,
        timeOfBirth: profile.timeOfBirth || undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      return computeSadeSati(eph.moonRashi);
    } catch {
      return null;
    }
  }, [profile]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/more');
  };

  const fmt = (d: Date | null) =>
    d ? d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—';

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Back">
          <ArrowLeft size={24} color="#E8C87E" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Sade Sati</Text>
        <View style={{ width: 24 }} />
      </View>

      {!result ? (
        <View style={styles.center}>
          <Orbit size={40} color="#E8C87E" />
          <Text style={styles.emptyTitle}>Add your birth details</Text>
          <Text style={styles.muted}>
            Sade Sati is measured from your natal Moon sign. Add your date and place of birth to see your current Saturn phase.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          {/* Status hero */}
          <View style={[styles.hero, result.active ? styles.heroActive : result.dhaiya ? styles.heroDhaiya : styles.heroClear]}>
            <Text style={styles.heroEyebrow}>SATURN &amp; YOUR MOON</Text>
            <Text style={styles.heroTitle}>{result.title}</Text>
            <Text style={styles.heroSummary}>{result.summary}</Text>
            <View style={styles.chips}>
              <View style={styles.chip}><Text style={styles.chipText}>Saturn · {result.saturnRashiName}</Text></View>
              <View style={styles.chip}><Text style={styles.chipText}>Moon · {result.moonRashiName}</Text></View>
              <View style={styles.chip}><Text style={styles.chipText}>House {result.houseFromMoon} from Moon</Text></View>
            </View>
          </View>

          {/* Phase timeline when in Sade Sati */}
          {result.active && (
            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>THE THREE PHASES (~2.5 YEARS EACH)</Text>
              {PHASES.map((ph) => {
                const isNow = ph === result.phase;
                return (
                  <View key={ph} style={[styles.phaseRow, isNow && styles.phaseRowActive]}>
                    <View style={[styles.phaseDot, isNow && styles.phaseDotActive]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.phaseName, isNow && styles.phaseNameActive]}>
                        {ph}{ph === 'Rising' ? ' · 12th from Moon' : ph === 'Peak' ? ' · over Moon' : ' · 2nd from Moon'}
                      </Text>
                      {isNow && (
                        <Text style={styles.phaseMeta}>Current phase · approx. ends {fmt(result.approxPhaseEnd)}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
              <View style={styles.overallRow}>
                <Text style={styles.overallLabel}>Whole Sade Sati ends around</Text>
                <Text style={styles.overallValue}>{fmt(result.approxOverallEnd)}</Text>
              </View>
            </View>
          )}

          {/* Next start when not active */}
          {!result.active && result.approxNextStart && (
            <View style={styles.card}>
              <View style={styles.nextRow}>
                <Text style={styles.overallLabel}>Next Sade Sati begins around</Text>
                <Text style={styles.overallValue}>{fmt(result.approxNextStart)}</Text>
              </View>
              {result.dhaiya && (
                <Text style={styles.phaseMeta}>Current Dhaiya approx. ends {fmt(result.approxPhaseEnd)}</Text>
              )}
            </View>
          )}

          {/* Guidance */}
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>WHAT IT MEANS</Text>
            <Text style={styles.guidance}>{result.guidance}</Text>
          </View>

          <Text style={styles.disclaimer}>
            Phase dates are approximate — Saturn's retrograde motion shifts exact sign-change
            timing by weeks. Computed with the sidereal (Lahiri) system, from your natal Moon
            sign. Offered for guidance and reflection, not prediction.
          </Text>
        </ScrollView>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  topTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  muted: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#8B88A0', textAlign: 'center', lineHeight: 20 },

  hero: {
    borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(232,200,126,0.25)',
  },
  heroActive: { backgroundColor: 'rgba(217,164,65,0.08)', borderColor: 'rgba(217,164,65,0.45)' },
  heroDhaiya: { backgroundColor: 'rgba(180,155,230,0.08)', borderColor: 'rgba(180,155,230,0.4)' },
  heroClear: { backgroundColor: 'rgba(105,199,121,0.06)', borderColor: 'rgba(105,199,121,0.35)' },
  heroEyebrow: { fontSize: 11, fontFamily: 'Inter-SemiBold', color: '#8B88A0', letterSpacing: 2, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8', marginBottom: 8 },
  heroSummary: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#C7C4D6', lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 24, paddingVertical: 5, paddingHorizontal: 12,
  },
  chipText: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#F4F1E8' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(232,200,126,0.25)',
    borderRadius: 16, padding: 16, marginBottom: 12,
  },
  cardEyebrow: { fontSize: 11, fontFamily: 'Inter-SemiBold', color: '#8B88A0', letterSpacing: 2, marginBottom: 12 },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10 },
  phaseRowActive: { backgroundColor: 'rgba(217,164,65,0.08)' },
  phaseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.2)' },
  phaseDotActive: { backgroundColor: '#D9A441' },
  phaseName: { fontSize: 15, fontFamily: 'Inter-Medium', color: '#C7C4D6' },
  phaseNameActive: { color: '#F4F1E8', fontFamily: 'Inter-SemiBold' },
  phaseMeta: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#D9A441', marginTop: 3 },
  overallRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  nextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overallLabel: { fontSize: 13, fontFamily: 'Inter-Medium', color: '#C7C4D6', flexShrink: 1 },
  overallValue: { fontSize: 15, fontFamily: 'PlayfairDisplay-Bold', color: '#E8C87E' },
  guidance: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#C7C4D6', lineHeight: 22 },
  disclaimer: { fontSize: 11, fontFamily: 'Inter-Regular', color: '#8B88A0', lineHeight: 16, marginTop: 8, textAlign: 'center' },
});
