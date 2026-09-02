import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, FileText, Sparkles } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import ReportViewer from '@/components/ReportViewer';
import { useChart } from '@/contexts/ChartContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { REPORTS_REQUIRE_ENTITLEMENT } from '@/constants/plans';
import { buildReportHtml, buildForecastReportHtml, REPORT_META, ReportType } from '@/utils/reports/reportHtml';
import type { Period } from '@/utils/jyotish/forecast';
import { tap } from '@/utils/haptics';
import { registerPositiveMoment } from '@/utils/review';
import { getOrStartDelivery, formatReadyBy } from '@/utils/reportDelivery';
import { useLanguage } from '@/contexts/LanguageContext';

const isReportType = (t: unknown): t is ReportType =>
  t === 'astrology' || t === 'numerology' || t === 'gemstone';

export default function ReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeProfile: profile } = useChart();
  const { user } = useAuth();
  const { hasReports } = usePremium();
  const { t } = useLanguage();
  const locked = REPORTS_REQUIRE_ENTITLEMENT && !hasReports;
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

  // Delivery: the report is generated on-device instantly, but held for 1–2 hours
  // so it feels individually prepared. We promise "within 24 hours" and deliver
  // early with a notification. Once ready it stays ready (instant on later opens).
  // Keyed per user + report (period for forecast).
  const reportKey = isForecast ? `forecast-${period}` : type;
  const deliveryKey = `${user?.id ?? 'me'}:${reportKey}`;

  const [ready, setReady] = useState(false);
  const [readyAt, setReadyAt] = useState<number | null>(null);
  useEffect(() => {
    if (!user || !html || locked) return; // nothing to deliver until entitled
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    (async () => {
      const st = await getOrStartDelivery(deliveryKey, title);
      if (cancelled) return;
      setReadyAt(st.readyAt);
      if (st.state === 'ready') {
        setReady(true);
        return;
      }
      setReady(false);
      // If it happens to be due very soon (e.g. testing), flip while the screen is open.
      const ms = st.readyAt - Date.now();
      if (ms > 0 && ms < 3 * 60_000) timer = setTimeout(() => setReady(true), ms);
    })();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryKey, html === null, user?.id, locked]);

  // Opening a ready report is a high-satisfaction moment — quietly (at most once)
  // ask for a Play rating.
  useEffect(() => {
    if (ready) registerPositiveMoment();
  }, [ready]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/reports' as Href);
  };

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
                {per === 'monthly' ? t('common.monthly') : t('common.yearly')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!user ? (
        <View style={styles.center}>
          <FileText size={40} color="#E8C87E" />
          <Text style={styles.emptyTitle}>{t('report.signInTitle')}</Text>
          <Text style={styles.muted}>
            Detailed reports are available to signed-in members. Sign in or create a free account to generate and save yours.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => { tap(); router.push('/login'); }}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text style={styles.signInBtnText}>{t('common.signInUp')}</Text>
          </TouchableOpacity>
        </View>
      ) : locked ? (
        <View style={styles.center}>
          <FileText size={40} color="#E8C87E" />
          <Text style={styles.emptyTitle}>{t('report.unlockTitle')}</Text>
          <Text style={styles.muted}>
            Reports are a premium feature — a beautifully formatted, multi-page reading from your chart. Unlock with a code, or with Astropanth Plus.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => { tap(); router.push('/premium'); }}
            accessibilityRole="button"
            accessibilityLabel="Unlock reports"
          >
            <Text style={styles.signInBtnText}>{t('common.unlock')}</Text>
          </TouchableOpacity>
        </View>
      ) : !html ? (
        <View style={styles.center}>
          <FileText size={40} color="#E8C87E" />
          <Text style={styles.emptyTitle}>{t('common.addBirthTitle')}</Text>
          <Text style={styles.muted}>{t('report.addBirthBody')}</Text>
        </View>
      ) : !ready ? (
        <View style={styles.center}>
          <Sparkles size={44} color="#E8C87E" />
          <Text style={styles.emptyTitle}>{t('report.preparingTitle')}</Text>
          <Text style={styles.muted}>{t('report.preparingBody')}</Text>
          {readyAt ? <Text style={styles.prepStep}>{t('report.readyBy', { time: formatReadyBy(readyAt) })}</Text> : null}
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => { tap(); goBack(); }}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={styles.signInBtnText}>{t('common.gotIt')}</Text>
          </TouchableOpacity>
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
