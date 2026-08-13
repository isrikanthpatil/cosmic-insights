import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import { useChart } from '@/contexts/ChartContext';
import { getCoordinatesForPlace } from '@/utils/astrology';
import { computeKundli, Kundli, ChartGraha } from '@/utils/jyotish/kundli';

const GRAHA_ABBR: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju',
  Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

// South-Indian chart: fixed 4x4 grid, rashi 1-12 around the perimeter.
// index (row*4+col) -> rashi number, or 0 for the centre block.
const GRID: number[] = [
  12, 1, 2, 3,
  11, 0, 0, 4,
  10, 0, 0, 5,
  9, 8, 7, 6,
];

export default function KundliScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeProfile: profile } = useChart();

  const kundli: Kundli | null = useMemo(() => {
    if (!profile) return null;
    const coords = getCoordinatesForPlace(profile.placeOfBirth) ?? { latitude: 22, longitude: 79 };
    try {
      return computeKundli({
        dateOfBirth: profile.dateOfBirth,
        timeOfBirth: profile.timeOfBirth || undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } catch {
      return null;
    }
  }, [profile]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/more');
  };

  const screenW = Dimensions.get('window').width;
  const cell = Math.floor((Math.min(screenW, 520) - 32) / 4);

  const grahasByRashi = (r: number): ChartGraha[] =>
    kundli ? kundli.grahas.filter((g) => g.rashi === r) : [];

  const fmtYears = (y: number) => `${y.toFixed(1)} yrs`;
  const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Back">
          <ArrowLeft size={24} color="#E8C87E" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Vedic Kundli</Text>
        <View style={{ width: 24 }} />
      </View>

      {!profile ? (
        <View style={styles.center}><Text style={styles.muted}>Add your birth details to see your Kundli.</Text></View>
      ) : !kundli ? (
        <View style={styles.center}><Text style={styles.muted}>Could not compute the chart. Please check your birth details.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>D1 (Rashi) chart for {profile.firstName}</Text>

          {kundli.lowConfidence && (
            <Text style={styles.note}>
              No birth time set — the Ascendant (Lagna) and houses need an exact time. Planet signs and the Dasha use noon as an estimate. Add your birth time in Profile for a precise chart.
            </Text>
          )}

          {/* South Indian chart grid */}
          <View style={[styles.grid, { width: cell * 4 + 2 }]}>
            {GRID.map((r, i) => {
              if (r === 0) {
                // Render the centre label once (top-left centre cell).
                const isLabelCell = i === 5;
                return (
                  <View key={i} style={[styles.cellCentre, { width: cell, height: cell }]}>
                    {isLabelCell && <Text style={styles.centreLabel}>Rashi{'\n'}D1</Text>}
                  </View>
                );
              }
              const isLagna = kundli.lagnaRashi === r;
              const list = grahasByRashi(r);
              return (
                <View key={i} style={[styles.cell, { width: cell, height: cell }, isLagna && styles.cellLagna]}>
                  {isLagna && <Text style={styles.lagnaTag}>La</Text>}
                  <Text style={styles.cellSign}>{r}</Text>
                  <View style={styles.cellPlanets}>
                    {list.map((g) => (
                      <Text key={g.name} style={styles.planetChip}>
                        {GRAHA_ABBR[g.name]}{g.retrograde ? '↺' : ''}
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Summary */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Lagna</Text>
              <Text style={styles.summaryValue}>{kundli.lagnaName ?? '—'}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Moon Rashi</Text>
              <Text style={styles.summaryValue}>{kundli.moonRashiName}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Nakshatra</Text>
              <Text style={styles.summaryValueSm}>{kundli.moonNakshatraName} · pada {kundli.moonPada}</Text>
            </View>
          </View>

          {/* Planet table */}
          <Text style={styles.sectionTitle}>Graha Positions</Text>
          <View style={styles.table}>
            <View style={[styles.tr, styles.trHead]}>
              <Text style={[styles.th, styles.colP]}>Graha</Text>
              <Text style={[styles.th, styles.colR]}>Rashi</Text>
              <Text style={[styles.th, styles.colH]}>House</Text>
              <Text style={[styles.th, styles.colN]}>Nakshatra</Text>
            </View>
            {kundli.grahas.map((g) => (
              <View key={g.name} style={styles.tr}>
                <Text style={[styles.td, styles.colP]}>{g.name}{g.retrograde ? ' ↺' : ''}</Text>
                <Text style={[styles.td, styles.colR]}>{g.rashiName}</Text>
                <Text style={[styles.td, styles.colH]}>{g.house ?? '—'}</Text>
                <Text style={[styles.tdSm, styles.colN]}>{g.nakshatraName}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.legend}>↺ = retrograde · Houses are whole-sign from the Lagna</Text>

          {/* Vimshottari Dasha */}
          {kundli.dasha && (
            <>
              <Text style={styles.sectionTitle}>Vimshottari Dasha</Text>
              {(() => {
                const d = kundli.dasha!;
                const maha = d.mahadashas[d.currentMahaIndex];
                return (
                  <View style={styles.dashaNow}>
                    <Text style={styles.dashaNowLabel}>Running now</Text>
                    <Text style={styles.dashaNowValue}>
                      {maha.lord} Mahadasha
                      {d.currentAntar ? `  ·  ${d.currentAntar.lord} Antardasha` : ''}
                    </Text>
                    <Text style={styles.dashaNowSub}>
                      {maha.lord} till {fmtDate(maha.end)}
                      {d.currentAntar ? `   ·   ${d.currentAntar.lord} till ${fmtDate(d.currentAntar.end)}` : ''}
                    </Text>
                  </View>
                );
              })()}
              <View style={styles.table}>
                {kundli.dasha.mahadashas.slice(0, 9).map((m, i) => (
                  <View key={i} style={[styles.tr, i === kundli.dasha!.currentMahaIndex && styles.trActive]}>
                    <Text style={[styles.td, { flex: 1.2 }]}>{m.lord}</Text>
                    <Text style={[styles.tdSm, { flex: 2 }]}>{fmtDate(m.start)} – {fmtDate(m.end)}</Text>
                    <Text style={[styles.tdSm, { flex: 1, textAlign: 'right' }]}>{fmtYears(m.years)}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.legend}>
                The 120-year Vimshottari cycle, seeded by your Janma Nakshatra ({kundli.moonNakshatraName}).
              </Text>
            </>
          )}

          <Text style={styles.disclaimer}>
            Sidereal (Lahiri ayanamsa {kundli.ayanamsa.toFixed(2)}°). For guidance and self-reflection, not a substitute for professional advice.
          </Text>
        </ScrollView>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  topTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  muted: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#8B88A0', textAlign: 'center', lineHeight: 20 },
  subtitle: { fontSize: 13, fontFamily: 'Inter-Medium', color: '#C7C4D6', marginBottom: 12 },
  note: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#D9A441', lineHeight: 17, marginBottom: 12, backgroundColor: 'rgba(217,164,65,0.08)', borderRadius: 10, padding: 10 },

  grid: { alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: 'rgba(232,200,126,0.4)', marginBottom: 16 },
  cell: { borderWidth: 0.5, borderColor: 'rgba(232,200,126,0.25)', padding: 3 },
  cellCentre: { borderWidth: 0.5, borderColor: 'rgba(232,200,126,0.12)', alignItems: 'center', justifyContent: 'center' },
  cellLagna: { backgroundColor: 'rgba(232,200,126,0.10)', borderColor: 'rgba(232,200,126,0.6)' },
  centreLabel: { fontSize: 12, fontFamily: 'PlayfairDisplay-Bold', color: '#7E7B92', textAlign: 'center' },
  cellSign: { fontSize: 9, fontFamily: 'Inter-Regular', color: '#6E6B84' },
  lagnaTag: { position: 'absolute', top: 2, right: 3, fontSize: 8, fontFamily: 'Inter-SemiBold', color: '#E8C87E' },
  cellPlanets: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 2 },
  planetChip: { fontSize: 11, fontFamily: 'Inter-SemiBold', color: '#F4F1E8' },

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  summaryCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 12, padding: 10, alignItems: 'center' },
  summaryLabel: { fontSize: 10, fontFamily: 'Inter-SemiBold', color: '#8B88A0', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 15, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8', textAlign: 'center' },
  summaryValueSm: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#F4F1E8', textAlign: 'center' },

  sectionTitle: { fontSize: 17, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8', marginTop: 20, marginBottom: 10 },
  table: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 12, overflow: 'hidden' },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  trHead: { backgroundColor: 'rgba(232,200,126,0.08)' },
  trActive: { backgroundColor: 'rgba(232,200,126,0.10)' },
  th: { fontSize: 11, fontFamily: 'Inter-SemiBold', color: '#E8C87E', letterSpacing: 0.5 },
  td: { fontSize: 13, fontFamily: 'Inter-Medium', color: '#F4F1E8' },
  tdSm: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#C7C4D6' },
  colP: { flex: 1.3 }, colR: { flex: 1.2 }, colH: { flex: 0.8 }, colN: { flex: 1.6 },
  legend: { fontSize: 11, fontFamily: 'Inter-Regular', color: '#7E7B92', marginTop: 8, lineHeight: 16 },

  dashaNow: { backgroundColor: 'rgba(232,200,126,0.10)', borderWidth: 1, borderColor: 'rgba(232,200,126,0.35)', borderRadius: 12, padding: 14, marginBottom: 10 },
  dashaNowLabel: { fontSize: 10, fontFamily: 'Inter-SemiBold', color: '#E8C87E', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  dashaNowValue: { fontSize: 16, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8', marginBottom: 4 },
  dashaNowSub: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#C7C4D6', lineHeight: 17 },

  disclaimer: { fontSize: 11, fontFamily: 'Inter-Regular', color: '#6E6B84', lineHeight: 16, textAlign: 'center', marginTop: 20, paddingHorizontal: 8 },
});
