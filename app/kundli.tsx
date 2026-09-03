import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import ShareCardButton from '@/components/ShareCardButton';
import { registerPositiveMoment } from '@/utils/review';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChart } from '@/contexts/ChartContext';
import { getCoordinatesForPlace } from '@/utils/astrology';
import { resolveAndCache, useCoordsNonce } from '@/utils/coords';
import { computeKundli, Kundli, ChartGraha, NAKSHATRA_INFO } from '@/utils/jyotish/kundli';

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
  const { t } = useLanguage();

  // Resolve precise coordinates for the birthplace (accurate Lagna); recompute
  // when they arrive.
  const coordsNonce = useCoordsNonce();
  useEffect(() => {
    resolveAndCache(profile?.placeOfBirth);
  }, [profile?.placeOfBirth]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, coordsNonce]);

  // Viewing a full Kundli is a high-satisfaction moment — a good time to (rarely)
  // ask for a Play rating. The helper self-gates so this fires at most once.
  useEffect(() => {
    if (kundli) registerPositiveMoment();
  }, [kundli]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/more');
  };

  const sunRashiName = kundli?.grahas.find((g) => g.name === 'Sun')?.rashiName ?? '—';
  const kundliShareData = kundli
    ? {
        eyebrow: t('nav.kundli'),
        title: kundli.lagnaName
          ? t('kundli.lagnaTitle', { name: kundli.lagnaName })
          : t('kundli.moonTitle', { name: kundli.moonRashiName }),
        subtitle: t('kundli.shareSubtitle', { rashi: kundli.moonRashiName, nakshatra: kundli.moonNakshatraName }),
        body:
          `${kundli.lagnaName ? t('kundli.ascendantPrefix', { name: kundli.lagnaName }) : ''}` +
          t('kundli.shareBody', { sun: sunRashiName, moon: kundli.moonRashiName, nakshatra: kundli.moonNakshatraName }),
        chips: [
          { label: t('kundli.lagna'), value: kundli.lagnaName ?? '—' },
          { label: t('label.moon'), value: kundli.moonRashiName },
          { label: t('label.sun'), value: sunRashiName },
        ],
      }
    : null;
  const kundliShareMsg = kundli
    ? t('kundli.shareMsg', {
        lagnaPart: kundli.lagnaName ? t('kundli.shareMsgLagna', { name: kundli.lagnaName }) : '',
        moon: kundli.moonRashiName,
        nakshatra: kundli.moonNakshatraName,
      })
    : '';

  const screenW = Dimensions.get('window').width;
  const cell = Math.floor((Math.min(screenW, 520) - 32) / 4);

  const grahasByRashi = (r: number): ChartGraha[] =>
    kundli ? kundli.grahas.filter((g) => g.rashi === r) : [];

  const fmtYears = (y: number) => t('kundli.yearsShort', { years: y.toFixed(1) });
  const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <ArrowLeft size={24} color="#E8C87E" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t('nav.kundli')}</Text>
        {kundliShareData ? (
          <ShareCardButton data={kundliShareData} message={kundliShareMsg} label={t('common.share')} />
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {!profile ? (
        <View style={styles.center}><Text style={styles.muted}>{t('kundli.emptyProfile')}</Text></View>
      ) : !kundli ? (
        <View style={styles.center}><Text style={styles.muted}>{t('kundli.computeError')}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>{t('kundli.d1For', { name: profile.firstName })}</Text>

          {kundli.lowConfidence && (
            <Text style={styles.note}>
              {t('kundli.noTimeNote')}
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
                    {isLabelCell && <Text style={styles.centreLabel}>{t('kundli.centreLabel')}</Text>}
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
              <Text style={styles.summaryLabel}>{t('kundli.lagna')}</Text>
              <Text style={styles.summaryValue}>{kundli.lagnaName ?? '—'}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{t('kundli.moonRashi')}</Text>
              <Text style={styles.summaryValue}>{kundli.moonRashiName}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{t('panchang.nakshatra')}</Text>
              <Text style={styles.summaryValueSm}>{t('kundli.nakshatraPada', { name: kundli.moonNakshatraName, pada: kundli.moonPada })}</Text>
            </View>
          </View>

          {/* Janma Nakshatra */}
          {(() => {
            const info = NAKSHATRA_INFO[kundli.moonNakshatra - 1];
            if (!info) return null;
            return (
              <View style={styles.nakCard}>
                <Text style={styles.nakTitle}>{t('kundli.janmaNakshatra', { name: kundli.moonNakshatraName, pada: kundli.moonPada })}</Text>
                <Text style={styles.nakMeta}>
                  {t('kundli.nakMeta', { deity: info.deity, symbol: info.symbol, gana: info.gana, lord: info.lord })}
                </Text>
                <Text style={styles.nakNature}>{info.nature}</Text>
              </View>
            );
          })()}

          {/* Planet table */}
          <Text style={styles.sectionTitle}>{t('kundli.grahaPositions')}</Text>
          <View style={styles.table}>
            <View style={[styles.tr, styles.trHead]}>
              <Text style={[styles.th, styles.colP]}>{t('kundli.graha')}</Text>
              <Text style={[styles.th, styles.colR]}>{t('kundli.rashi')}</Text>
              <Text style={[styles.th, styles.colH]}>{t('kundli.house')}</Text>
              <Text style={[styles.th, styles.colN]}>{t('panchang.nakshatra')}</Text>
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
          <Text style={styles.legend}>{t('kundli.legend')}</Text>

          {/* Vimshottari Dasha */}
          {kundli.dasha && (
            <>
              <Text style={styles.sectionTitle}>{t('kundli.vimshottariDasha')}</Text>
              {(() => {
                const d = kundli.dasha!;
                const maha = d.mahadashas[d.currentMahaIndex];
                return (
                  <View style={styles.dashaNow}>
                    <Text style={styles.dashaNowLabel}>{t('kundli.runningNow')}</Text>
                    <Text style={styles.dashaNowValue}>
                      {t('kundli.mahadashaLord', { lord: maha.lord })}
                      {d.currentAntar ? `  ·  ${t('kundli.antardashaLord', { lord: d.currentAntar.lord })}` : ''}
                    </Text>
                    <Text style={styles.dashaNowSub}>
                      {t('kundli.lordTill', { lord: maha.lord, date: fmtDate(maha.end) })}
                      {d.currentAntar ? `   ·   ${t('kundli.lordTill', { lord: d.currentAntar.lord, date: fmtDate(d.currentAntar.end) })}` : ''}
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
                {t('kundli.cycleLegend', { name: kundli.moonNakshatraName })}
              </Text>
            </>
          )}

          <Text style={styles.disclaimer}>
            {t('kundli.disclaimer', { ayanamsa: kundli.ayanamsa.toFixed(2) })}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  muted: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#8B88A0', textAlign: 'center', lineHeight: 20 },
  subtitle: { fontSize: 13, fontFamily: 'Inter-Medium', color: '#C7C4D6', marginBottom: 12 },
  note: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#D9A441', lineHeight: 17, marginBottom: 12, backgroundColor: 'rgba(217,164,65,0.08)', borderRadius: 10, padding: 10 },

  grid: { alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: 'rgba(232,200,126,0.4)', marginBottom: 16 },
  cell: { borderWidth: 0.5, borderColor: 'rgba(232,200,126,0.25)', padding: 3 },
  cellCentre: { borderWidth: 0.5, borderColor: 'rgba(232,200,126,0.12)', alignItems: 'center', justifyContent: 'center' },
  cellLagna: { backgroundColor: 'rgba(232,200,126,0.10)', borderColor: 'rgba(232,200,126,0.6)' },
  centreLabel: { fontSize: 12, fontFamily: 'PlayfairDisplay-Bold', color: '#8B88A0', textAlign: 'center' },
  cellSign: { fontSize: 9, fontFamily: 'Inter-Regular', color: '#6E6B84' },
  lagnaTag: { position: 'absolute', top: 2, right: 3, fontSize: 8, fontFamily: 'Inter-SemiBold', color: '#E8C87E' },
  cellPlanets: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 2 },
  planetChip: { fontSize: 11, fontFamily: 'Inter-SemiBold', color: '#F4F1E8' },

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  summaryCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 12, padding: 10, alignItems: 'center' },
  summaryLabel: { fontSize: 10, fontFamily: 'Inter-SemiBold', color: '#8B88A0', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 15, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8', textAlign: 'center' },
  summaryValueSm: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#F4F1E8', textAlign: 'center' },

  nakCard: { backgroundColor: 'rgba(180,155,230,0.08)', borderWidth: 1, borderColor: 'rgba(180,155,230,0.30)', borderRadius: 12, padding: 14, marginTop: 12 },
  nakTitle: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#F4F1E8', marginBottom: 6 },
  nakMeta: { fontSize: 11.5, fontFamily: 'Inter-Regular', color: '#B49BE6', lineHeight: 17, marginBottom: 6 },
  nakNature: { fontSize: 13, fontFamily: 'Inter-Regular', color: '#C7C4D6', lineHeight: 19 },
  sectionTitle: { fontSize: 17, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8', marginTop: 20, marginBottom: 10 },
  table: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 12, overflow: 'hidden' },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  trHead: { backgroundColor: 'rgba(232,200,126,0.08)' },
  trActive: { backgroundColor: 'rgba(232,200,126,0.10)' },
  th: { fontSize: 11, fontFamily: 'Inter-SemiBold', color: '#E8C87E', letterSpacing: 0.5 },
  td: { fontSize: 13, fontFamily: 'Inter-Medium', color: '#F4F1E8' },
  tdSm: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#C7C4D6' },
  colP: { flex: 1.3 }, colR: { flex: 1.2 }, colH: { flex: 0.8 }, colN: { flex: 1.6 },
  legend: { fontSize: 11, fontFamily: 'Inter-Regular', color: '#8B88A0', marginTop: 8, lineHeight: 16 },

  dashaNow: { backgroundColor: 'rgba(232,200,126,0.10)', borderWidth: 1, borderColor: 'rgba(232,200,126,0.35)', borderRadius: 12, padding: 14, marginBottom: 10 },
  dashaNowLabel: { fontSize: 10, fontFamily: 'Inter-SemiBold', color: '#E8C87E', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  dashaNowValue: { fontSize: 16, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8', marginBottom: 4 },
  dashaNowSub: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#C7C4D6', lineHeight: 17 },

  disclaimer: { fontSize: 11, fontFamily: 'Inter-Regular', color: '#6E6B84', lineHeight: 16, textAlign: 'center', marginTop: 20, paddingHorizontal: 8 },
});
