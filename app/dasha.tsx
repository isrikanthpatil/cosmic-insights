import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Clock } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import { useChart } from '@/contexts/ChartContext';
import { getCoordinatesForPlace } from '@/utils/astrology';
import { computeKundli, DashaPeriod } from '@/utils/jyotish/kundli';

const fmtD = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const dur = (years: number): string => {
  if (years >= 1) {
    const y = Math.floor(years);
    const mo = Math.round((years - y) * 12);
    return mo > 0 ? `${y}y ${mo}m` : `${y}y`;
  }
  const months = years * 12;
  if (months >= 1) {
    const mo = Math.floor(months);
    const dys = Math.round((months - mo) * 30);
    return dys > 0 ? `${mo}m ${dys}d` : `${mo}m`;
  }
  return `${Math.round(years * 365.25)}d`;
};

/** Percent elapsed of a period at `now`, clamped 0-100. */
const pctElapsed = (p: DashaPeriod, now: Date): number => {
  const span = p.end.getTime() - p.start.getTime();
  if (span <= 0) return 0; // zero/negative span (boundary edge case) — avoid NaN
  const t = (now.getTime() - p.start.getTime()) / span;
  return Math.max(0, Math.min(100, Math.round(t * 100)));
};

export default function DashaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeProfile: profile } = useChart();
  const now = useMemo(() => new Date(), []);

  const dasha = useMemo(() => {
    if (!profile?.dateOfBirth) return null;
    try {
      const coords = getCoordinatesForPlace(profile.placeOfBirth) ?? { latitude: 22, longitude: 79 };
      return computeKundli({
        dateOfBirth: profile.dateOfBirth,
        timeOfBirth: profile.timeOfBirth || undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }).dasha;
    } catch {
      return null;
    }
  }, [profile]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/more');
  };

  const maha = dasha ? dasha.mahadashas[dasha.currentMahaIndex] : null;

  const Level = ({ tier, p }: { tier: string; p: DashaPeriod }) => (
    <View style={styles.levelCard}>
      <View style={styles.levelHead}>
        <Text style={styles.levelTier}>{tier}</Text>
        <Text style={styles.levelDur}>{dur(p.years)}</Text>
      </View>
      <Text style={styles.levelLord}>{p.lord}</Text>
      <Text style={styles.levelDates}>{fmtD(p.start)} → {fmtD(p.end)}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pctElapsed(p, now)}%` }]} />
      </View>
      <Text style={styles.levelPct}>{pctElapsed(p, now)}% elapsed</Text>
    </View>
  );

  const ListRow = ({ p, active }: { p: DashaPeriod; active: boolean }) => (
    <View style={[styles.row, active && styles.rowActive]}>
      <View style={[styles.rowDot, active && styles.rowDotActive]} />
      <Text style={[styles.rowLord, active && styles.rowLordActive]}>{p.lord}</Text>
      <Text style={styles.rowDates}>{fmtD(p.start)} – {fmtD(p.end)}</Text>
    </View>
  );

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Back">
          <ArrowLeft size={24} color="#E8C87E" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Dasha Periods</Text>
        <View style={{ width: 24 }} />
      </View>

      {!dasha || !maha ? (
        <View style={styles.center}>
          <Clock size={40} color="#E8C87E" />
          <Text style={styles.emptyTitle}>Add your birth details</Text>
          <Text style={styles.muted}>
            Vimshottari Dasha is calculated from your natal Moon. Add your date and place of birth to see your current periods.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.introEyebrow}>YOU ARE HERE</Text>
          <Text style={styles.intro}>
            Your running Vimshottari period, nested from the major cycle down to the current sub-sub-period.
          </Text>

          <Level tier="Mahadasha · major period" p={maha} />
          {dasha.currentAntar && <Level tier="Antardasha · sub-period" p={dasha.currentAntar} />}
          {dasha.currentPratyantar && <Level tier="Pratyantardasha · sub-sub-period" p={dasha.currentPratyantar} />}

          {dasha.currentAntar && (
            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>ANTARDASHAS IN {maha.lord.toUpperCase()} MAHADASHA</Text>
              {dasha.antardashas.map((a, i) => (
                <ListRow key={i} p={a} active={a.lord === dasha.currentAntar!.lord} />
              ))}
            </View>
          )}

          {dasha.currentPratyantar && dasha.currentAntar && (
            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>PRATYANTARDASHAS IN {dasha.currentAntar.lord.toUpperCase()} ANTARDASHA</Text>
              {dasha.pratyantardashas.map((p, i) => (
                <ListRow key={i} p={p} active={p.lord === dasha.currentPratyantar!.lord} />
              ))}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>MAHADASHA TIMELINE</Text>
            {dasha.mahadashas.map((m, i) => (
              <ListRow key={i} p={m} active={i === dasha.currentMahaIndex} />
            ))}
          </View>

          <Text style={styles.disclaimer}>
            Vimshottari Dasha (120-year cycle) from your natal Moon nakshatra, sidereal
            (Lahiri). If no birth time is set, noon is used — sub-period dates can shift.
            Offered for guidance and reflection.
          </Text>
        </ScrollView>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  topTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  muted: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#8B88A0', textAlign: 'center', lineHeight: 20 },

  introEyebrow: { fontSize: 11, fontFamily: 'Inter-SemiBold', color: '#8B88A0', letterSpacing: 2, marginBottom: 6 },
  intro: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#C7C4D6', lineHeight: 20, marginBottom: 14 },

  levelCard: {
    backgroundColor: 'rgba(232,200,126,0.06)', borderWidth: 1, borderColor: 'rgba(232,200,126,0.3)',
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  levelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelTier: { fontSize: 11, fontFamily: 'Inter-SemiBold', color: '#8B88A0', letterSpacing: 1, textTransform: 'uppercase' },
  levelDur: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#E8C87E' },
  levelLord: { fontSize: 22, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8', marginTop: 4 },
  levelDates: { fontSize: 13, fontFamily: 'Inter-Regular', color: '#C7C4D6', marginTop: 2 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#E8C87E' },
  levelPct: { fontSize: 11, fontFamily: 'Inter-Regular', color: '#8B88A0', marginTop: 5 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(232,200,126,0.25)',
    borderRadius: 16, padding: 16, marginTop: 12,
  },
  cardEyebrow: { fontSize: 11, fontFamily: 'Inter-SemiBold', color: '#8B88A0', letterSpacing: 1.5, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 8, borderRadius: 8 },
  rowActive: { backgroundColor: 'rgba(232,200,126,0.08)' },
  rowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  rowDotActive: { backgroundColor: '#E8C87E' },
  rowLord: { fontSize: 15, fontFamily: 'Inter-Medium', color: '#C7C4D6', width: 78 },
  rowLordActive: { color: '#F4F1E8', fontFamily: 'Inter-SemiBold' },
  rowDates: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#8B88A0', flex: 1, textAlign: 'right' },
  disclaimer: { fontSize: 11, fontFamily: 'Inter-Regular', color: '#8B88A0', lineHeight: 16, marginTop: 14, textAlign: 'center' },
});
