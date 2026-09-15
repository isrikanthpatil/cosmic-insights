import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Smartphone, Building2, Car } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import { colors, typography, fonts } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslatedMap } from '@/utils/i18nContent';
import { useChart } from '@/contexts/ChartContext';
import { calculateBirthNumber } from '@/utils/numerology';
import {
  analyzeMobile, analyzeName, analyzeVehicle, ToolResult, Relation,
} from '@/utils/numerologyTools';
import { tap } from '@/utils/haptics';

type Tab = 'mobile' | 'business' | 'vehicle';

const RELATION_COLOR: Record<Relation, string> = {
  friendly: '#7BC47F',
  neutral: colors.textSecondary,
  challenging: colors.amber,
};

export default function NumerologyTools() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const { activeProfile } = useChart();

  // The subject's Mulank (birth number), when a profile is loaded — powers the
  // compatibility note. Tools still work for guests, just without the personal note.
  const mulank = useMemo(() => {
    if (!activeProfile?.dateOfBirth) return undefined;
    try { return calculateBirthNumber(activeProfile.dateOfBirth); } catch { return undefined; }
  }, [activeProfile]);

  const [tab, setTab] = useState<Tab>('mobile');
  const [mobile, setMobile] = useState('');
  const [business, setBusiness] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [result, setResult] = useState<Record<Tab, ToolResult | null>>({
    mobile: null, business: null, vehicle: null,
  });

  const compute = (which: Tab) => {
    Keyboard.dismiss();
    tap();
    let r: ToolResult | null = null;
    if (which === 'mobile' && mobile.replace(/\D/g, '').length >= 4) r = analyzeMobile(mobile, mulank);
    if (which === 'business' && business.trim().length >= 2) r = analyzeName(business, mulank);
    if (which === 'vehicle' && vehicle.trim().length >= 3) r = analyzeVehicle(vehicle, mulank);
    setResult((prev) => ({ ...prev, [which]: r }));
  };

  // Collect every dynamic string so the runtime translator can localize results.
  const genStrings = useMemo(() => {
    const out: string[] = [];
    (Object.values(result) as (ToolResult | null)[]).forEach((r) => {
      if (!r) return;
      out.push(r.vibe, r.verdict);
      if (r.relationNote) out.push(r.relationNote);
    });
    return out;
  }, [result]);
  const tx = useTranslatedMap(genStrings, lang);

  const TABS: { key: Tab; label: string; icon: typeof Smartphone }[] = [
    { key: 'mobile', label: t('numTools.mobileTab'), icon: Smartphone },
    { key: 'business', label: t('numTools.businessTab'), icon: Building2 },
    { key: 'vehicle', label: t('numTools.vehicleTab'), icon: Car },
  ];

  const active = result[tab];

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => { if (router.canGoBack()) router.back(); }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={colors.gold} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t('numTools.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.intro}>{t('numTools.intro')}</Text>

        {/* Tab selector */}
        <View style={styles.tabsRow}>
          {TABS.map(({ key, label, icon: Icon }) => {
            const on = tab === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.tab, on && styles.tabOn]}
                onPress={() => { tap(); setTab(key); }}
                accessibilityRole="button"
              >
                <Icon size={18} color={on ? '#1A1A2E' : colors.gold} />
                <Text style={[styles.tabText, on && styles.tabTextOn]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Input for the active tab */}
        <Text style={styles.label}>{t(`numTools.${tab}Label`)}</Text>
        <TextInput
          style={styles.input}
          value={tab === 'mobile' ? mobile : tab === 'business' ? business : vehicle}
          onChangeText={tab === 'mobile' ? setMobile : tab === 'business' ? setBusiness : setVehicle}
          placeholder={t(`numTools.${tab}Placeholder`)}
          placeholderTextColor={colors.muted}
          keyboardType={tab === 'mobile' ? 'number-pad' : 'default'}
          autoCapitalize={tab === 'business' ? 'words' : 'characters'}
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => compute(tab)}
        />
        <TouchableOpacity style={styles.cta} onPress={() => compute(tab)} accessibilityRole="button">
          <Text style={styles.ctaText}>{t('numTools.calculate')}</Text>
        </TouchableOpacity>

        {/* Result */}
        {active && (
          <View style={styles.resultCard}>
            <Text style={styles.resultEyebrow}>{t('numTools.resultNumber')}</Text>
            <Text style={styles.resultNumber}>{active.number}</Text>
            <Text style={styles.resultTotal}>
              {t('numTools.totalReducesTo', { total: active.total, single: active.number })}
            </Text>
            <Text style={styles.resultVibe}>{tx(active.vibe)}</Text>
            <View style={styles.divider} />
            <Text style={styles.resultVerdict}>{tx(active.verdict)}</Text>
            {active.relation && active.relationNote && (
              <View style={styles.relationRow}>
                <View style={[styles.dot, { backgroundColor: RELATION_COLOR[active.relation] }]} />
                <Text style={[styles.relationText, { color: RELATION_COLOR[active.relation] }]}>
                  {tx(active.relationNote)}
                </Text>
              </View>
            )}
            {!mulank && (
              <Text style={styles.hint}>{t('numTools.signInHint')}</Text>
            )}
          </View>
        )}

        <Text style={styles.disclaimer}>{t('numTools.disclaimer')}</Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  topTitle: { ...typography.cardTitle, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  intro: { ...typography.body, color: colors.textSecondary, marginBottom: 18 },
  tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: colors.goldHairline, backgroundColor: 'rgba(232,200,126,0.04)',
  },
  tabOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  tabText: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.gold },
  tabTextOn: { color: '#1A1A2E' },
  label: { ...typography.microLabel, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    fontFamily: fonts.regular, color: colors.text, backgroundColor: 'rgba(255,255,255,0.03)',
  },
  cta: {
    marginTop: 14, backgroundColor: colors.gold, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
  },
  ctaText: { fontSize: 15, fontFamily: fonts.semiBold, color: '#1A1A2E' },
  resultCard: {
    marginTop: 24, borderRadius: 16, borderWidth: 1, borderColor: colors.goldHairline,
    backgroundColor: 'rgba(232,200,126,0.05)', padding: 20, alignItems: 'center',
  },
  resultEyebrow: { ...typography.microLabel, marginBottom: 4 },
  resultNumber: { fontSize: 56, fontFamily: fonts.display, color: colors.gold, lineHeight: 64 },
  resultTotal: { ...typography.caption, marginBottom: 12 },
  resultVibe: { ...typography.body, color: colors.text, textAlign: 'center' },
  divider: { height: 1, backgroundColor: colors.border, alignSelf: 'stretch', marginVertical: 16 },
  resultVerdict: { ...typography.body, textAlign: 'center' },
  relationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 14, alignSelf: 'stretch' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  relationText: { flex: 1, fontSize: 13, fontFamily: fonts.regular, lineHeight: 19 },
  hint: { ...typography.caption, textAlign: 'center', marginTop: 14 },
  disclaimer: { ...typography.caption, textAlign: 'center', marginTop: 24, lineHeight: 17 },
});
