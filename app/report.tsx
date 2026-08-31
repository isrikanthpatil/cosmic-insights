import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, FileText, Sparkles } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import ReportViewer from '@/components/ReportViewer';
import { useChart } from '@/contexts/ChartContext';
import { buildReportHtml, buildForecastReportHtml, REPORT_META, ReportType } from '@/utils/reports/reportHtml';
import type { Period } from '@/utils/jyotish/forecast';
import { tap } from '@/utils/haptics';
import { registerPositiveMoment } from '@/utils/review';

const isReportType = (t: unknown): t is ReportType =>
  t === 'astrology' || t === 'numerology' || t === 'gemstone';

// The report computes instantly, but we deliberately hold it behind a ~1 minute
// "preparing" screen so it reads as a considered, hand-prepared reading rather
// than an instant machine dump.
const PREPARE_MS = 62000;
const PREP_STEPS = [
  'Casting your birth chart…',
  'Calculating planetary positions…',
  'Mapping houses and nakshatras…',
  'Reviewing your dasha periods…',
  'Interpreting the placements…',
  'Composing your reading…',
  'Finalising your report…',
];

export default function ReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeProfile: profile } = useChart();
  const params = useLocalSearchParams<{ type?: string; period?: string }>();

  const rawType = String(params.type ?? 'astrology');
  const isForecast = rawType === 'forecast';
  const type: ReportType = isReportType(rawType) ? rawType : 'astrology';
  const [period, setPeriod] = useState<Period>(params.period === 'yearly' ? 'yearly' : 'monthly');

  const html = useMemo(() => {
    if (!profile?.dateOfBirth) return null;
    try {
      return isForecast ? buildForecastReportHtml(profile, period) : buildReportHtml(type, profile);
    } catch {
      return null;
    }
  }, [isForecast, type, period, profile]);

  const title = isForecast
    ? (period === 'yearly' ? 'Yearly Forecast' : 'Monthly Forecast')
    : REPORT_META[type].title;
  const fileName = isForecast
    ? (period === 'yearly' ? 'Astropanth-Yearly-Forecast' : 'Astropanth-Monthly-Forecast')
    : REPORT_META[type].file;

  // Preparation gate: fill a progress bar over ~1 minute, then reveal the report.
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const startRef = useRef(Date.now());
  useEffect(() => {
    if (!html) return; // nothing to prepare (no birth details)
    startRef.current = Date.now();
    setReady(false);
    setProgress(0);
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - startRef.current) / PREPARE_MS);
      setProgress(t);
      if (t >= 1) {
        clearInterval(id);
        setReady(true);
      }
    }, 300);
    return () => clearInterval(id);
    // Re-prepare only when the underlying report identity changes, not on every render.
  }, [isForecast, type, html === null]);

  // Finishing a report is a high-satisfaction moment — quietly (and at most once)
  // ask for a Play rating.
  useEffect(() => {
    if (ready) registerPositiveMoment();
  }, [ready]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/reports' as Href);
  };

  const stepIdx = Math.min(PREP_STEPS.length - 1, Math.floor(progress * PREP_STEPS.length));

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Back">
          <ArrowLeft size={24} color="#E8C87E" />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>

      {isForecast && (
        <View style={styles.segment}>
          {(['monthly', 'yearly'] as Period[]).map((per) => (
            <TouchableOpacity
              key={per}
              style={[styles.segBtn, period === per && styles.segBtnActive]}
              onPress={() => { tap(); setPeriod(per); }}
              accessibilityRole="button"
              accessibilityState={{ selected: period === per }}
            >
              <Text style={[styles.segText, period === per && styles.segTextActive]}>
                {per === 'monthly' ? 'Monthly' : 'Yearly'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!html ? (
        <View style={styles.center}>
          <FileText size={40} color="#E8C87E" />
          <Text style={styles.emptyTitle}>Add your birth details</Text>
          <Text style={styles.muted}>
            This report is built from your birth chart. Add your date and place of birth to generate it.
          </Text>
        </View>
      ) : !ready ? (
        <View style={styles.center}>
          <Sparkles size={44} color="#E8C87E" />
          <Text style={styles.emptyTitle}>Preparing your report…</Text>
          <Text style={styles.prepStep}>{PREP_STEPS[stepIdx]}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.muted}>
            We prepare each reading individually from your chart — this takes about a minute.
          </Text>
        </View>
      ) : (
        <ReportViewer html={html} fileName={fileName} />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  topTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8', flex: 1, textAlign: 'center' },
  segment: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(232,200,126,0.25)', padding: 4,
  },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  segBtnActive: { backgroundColor: '#E8C87E' },
  segText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#C7C4D6' },
  segTextActive: { color: '#0B0B1A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  muted: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#8B88A0', textAlign: 'center', lineHeight: 20 },
  prepStep: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#E8C87E', textAlign: 'center' },
  progressTrack: {
    width: '78%', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#E8C87E' },
});
