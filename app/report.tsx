import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, FileText } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import ReportViewer from '@/components/ReportViewer';
import { useChart } from '@/contexts/ChartContext';
import { buildReportHtml, REPORT_META, ReportType } from '@/utils/reports/reportHtml';

const isReportType = (t: unknown): t is ReportType =>
  t === 'astrology' || t === 'numerology' || t === 'gemstone';

export default function ReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeProfile: profile } = useChart();
  const params = useLocalSearchParams<{ type?: string }>();
  const type: ReportType = isReportType(params.type) ? params.type : 'astrology';

  const html = useMemo(() => {
    if (!profile?.dateOfBirth) return null;
    try {
      return buildReportHtml(type, profile);
    } catch {
      return null;
    }
  }, [type, profile]);

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
        <Text style={styles.topTitle} numberOfLines={1}>{REPORT_META[type].title}</Text>
        <View style={{ width: 24 }} />
      </View>

      {!html ? (
        <View style={styles.center}>
          <FileText size={40} color="#E8C87E" />
          <Text style={styles.emptyTitle}>Add your birth details</Text>
          <Text style={styles.muted}>
            This report is built from your birth chart. Add your date and place of birth to generate it.
          </Text>
        </View>
      ) : (
        <ReportViewer html={html} fileName={REPORT_META[type].file} />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  topTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8', flex: 1, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  muted: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#8B88A0', textAlign: 'center', lineHeight: 20 },
});
