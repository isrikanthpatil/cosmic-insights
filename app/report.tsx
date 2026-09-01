import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, FileText, Sparkles } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenBackground from '@/components/ScreenBackground';
import ReportViewer from '@/components/ReportViewer';
import { useChart } from '@/contexts/ChartContext';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
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

  // Once a given report has been generated, we remember it and skip the ~1 minute
  // "preparing" gate on every later open — so it only feels hand-prepared the first
  // time, and is instant thereafter. Keyed per user + report (period for forecast).
  const reportKey = isForecast ? `forecast-${period}` : type;
  const doneKey = `report_done_v1:${user?.id ?? 'me'}:${reportKey}`;

  // Preparation gate: fill a progress bar over ~1 minute, then reveal the report.
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const startRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!html) return; // nothing to prepare (no birth details)
    let cancelled = false;
    const clear = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
    (async () => {
      let alreadyDone = false;
      try { alreadyDone = (await AsyncStorage.getItem(doneKey)) === '1'; } catch {}
      if (cancelled) return;
      if (alreadyDone) {
        setProgress(1);
        setReady(true);
        return;
      }
      startRef.current = Date.now();
      setReady(false);
      setProgress(0);
      intervalRef.current = setInterval(() => {
        const t = Math.min(1, (Date.now() - startRef.current) / PREPARE_MS);
        setProgress(t);
        if (t >= 1) {
          clear();
          setReady(true);
          AsyncStorage.setItem(doneKey, '1').catch(() => {});
        }
      }, 300);
    })();
    return () => { cancelled = true; clear(); };
    // Re-prepare only when the underlying report identity changes, not on every render.
  }, [doneKey, html === null]);

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

      {user && isForecast && (
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

      {!user ? (
        <View style={styles.center}>
          <FileText size={40} color="#E8C87E" />
          <Text style={styles.emptyTitle}>Sign in to view reports</Text>
          <Text style={styles.muted}>
            Detailed reports are available to signed-in members. Sign in or create a free account to generate and save yours.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => { tap(); router.push('/login'); }}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text style={styles.signInBtnText}>Sign in / Sign up</Text>
          </TouchableOpacity>
        </View>
      ) : !html ? (
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
  signInBtn: {
    marginTop: 18, backgroundColor: '#E8C87E', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12,
  },
  signInBtnText: { color: '#161225', fontSize: 15, fontFamily: 'Inter-SemiBold' },
  prepStep: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#E8C87E', textAlign: 'center' },
  progressTrack: {
    width: '78%', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#E8C87E' },
});
