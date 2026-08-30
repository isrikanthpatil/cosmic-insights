import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, FileText } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import ReportViewer from '@/components/ReportViewer';
import { useChart } from '@/contexts/ChartContext';
import { buildReportHtml, buildForecastReportHtml, REPORT_META, ReportType } from '@/utils/reports/reportHtml';
import type { Period } from '@/utils/jyotish/forecast';
import { tap } from '@/utils/haptics';

const isReportType = (t: unknown): t is ReportType =>
  t === 'astrology' || t === 'numerology' || t === 'gemstone';

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
});
