import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Sunrise, Sunset, AlertTriangle } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import ShareCardButton from '@/components/ShareCardButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslatedMap } from '@/utils/i18nContent';
import { tap } from '@/utils/haptics';
import { computePanchang, KalamPeriod } from '@/utils/jyotish/panchang';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// The Panchang uses an India (IST) reference, so render every instant in IST
// (UTC+5:30) regardless of the device's own timezone — otherwise a phone set to
// another zone would show wrong sunrise / Rahu Kalam clock times.
const IST_OFFSET_MS = 5.5 * 3600000;
const toIST = (d: Date) => new Date(d.getTime() + IST_OFFSET_MS);

/** IST clock time, e.g. "5:23 AM". */
const fmt = (d: Date | null): string => {
  if (!d) return '—';
  const t = toIST(d);
  let h = t.getUTCHours();
  const m = t.getUTCMinutes();
  const ap = h < 12 ? 'AM' : 'PM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
};

/** "ends 6:50 AM", flagged when it rolls into the next IST day. */
const endsLabel = (from: Date, ends: Date | null): string => {
  if (!ends) return '';
  const a = toIST(from);
  const b = toIST(ends);
  const nextDay =
    a.getUTCFullYear() !== b.getUTCFullYear() ||
    a.getUTCMonth() !== b.getUTCMonth() ||
    a.getUTCDate() !== b.getUTCDate();
  return `ends ${fmt(ends)}${nextDay ? ' (next day)' : ''}`;
};

export default function PanchangScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang } = useLanguage();

  const now = useMemo(() => new Date(), []);
  const p = useMemo(() => {
    try {
      return computePanchang(now);
    } catch {
      return null;
    }
  }, [now]);

  // Localize the generated Panchang values (anga names, paksha, weekday, month,
  // lord, "ends …" sub-labels, kalam names). tx(englishAtom) → localized atom.
  const genStrings = p
    ? ([
        p.paksha, p.vara.lord, p.vara.english, MONTHS[toIST(now).getUTCMonth()],
        p.tithi.name, p.nakshatra.name, p.yoga.name, p.karana.name, p.vara.name,
        endsLabel(now, p.tithi.endsAt), endsLabel(now, p.nakshatra.endsAt),
        p.rahuKalam?.name, p.yamaganda?.name, p.gulika?.name,
      ].filter((s): s is string => typeof s === 'string' && s.trim().length > 0))
    : [];
  const tx = useTranslatedMap(genStrings, lang);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/more');
  };

  // Header date in IST, to match the IST-based weekday and timings.
  const istNow = toIST(now);
  const dateLine = p
    ? `${tx(p.vara.english)}, ${istNow.getUTCDate()} ${tx(MONTHS[istNow.getUTCMonth()])} ${istNow.getUTCFullYear()}`
    : '';

  const rahuStr = p?.rahuKalam ? `${fmt(p.rahuKalam.start)}–${fmt(p.rahuKalam.end)}` : '—';
  const panchangShareData = p
    ? {
        eyebrow: dateLine,
        title: p.tithi.name,
        subtitle: `${p.nakshatra.name} Nakshatra · ${p.paksha} Paksha`,
        body:
          `Tithi ${p.tithi.name}, Nakshatra ${p.nakshatra.name}, Yoga ${p.yoga.name}, Karana ${p.karana.name}. ` +
          `Sunrise ${fmt(p.sunrise)}, Sunset ${fmt(p.sunset)}.`,
        chips: [
          { label: 'Rahu Kalam', value: rahuStr },
          { label: 'Sunrise', value: fmt(p.sunrise) },
          { label: 'Sunset', value: fmt(p.sunset) },
        ],
      }
    : null;
  const panchangShareMsg = p
    ? `आज का पंचांग · Today's Panchang ✨ ${dateLine}\n` +
      `Tithi ${p.tithi.name}, Nakshatra ${p.nakshatra.name}. Rahu Kalam ${rahuStr}.\n\n` +
      `Free daily Panchang: https://www.astropanth.com`
    : '';

  const AngaRow = ({
    label,
    value,
    sub,
  }: {
    label: string;
    value: string;
    sub?: string;
  }) => (
    <View style={styles.angaRow}>
      <Text style={styles.angaLabel}>{label}</Text>
      <View style={styles.angaValueWrap}>
        <Text style={styles.angaValue}>{value}</Text>
        {sub ? <Text style={styles.angaSub}>{sub}</Text> : null}
      </View>
    </View>
  );

  const KalamRow = ({ period, danger }: { period: KalamPeriod | null; danger?: boolean }) =>
    period ? (
      <View style={[styles.kalamRow, danger && styles.kalamRowDanger]}>
        <Text style={[styles.kalamName, danger && styles.kalamNameDanger]}>{tx(period.name)}</Text>
        <Text style={[styles.kalamTime, danger && styles.kalamTimeDanger]}>
          {fmt(period.start)} – {fmt(period.end)}
        </Text>
      </View>
    ) : null;

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={goBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <ArrowLeft size={24} color="#E8C87E" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t('nav.panchang')}</Text>
        {panchangShareData ? (
          <ShareCardButton data={panchangShareData} message={panchangShareMsg} label={t('common.share')} />
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {!p ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>
            {t('panchang.computeError')}
          </Text>
        </View>
      ) : (
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.dateLine}>{dateLine}</Text>
        <Text style={styles.pakshaLine}>
          {t('panchang.pakshaRuledBy', { paksha: tx(p.paksha), lord: tx(p.vara.lord) })}
        </Text>

        {/* Five angas */}
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>{t('panchang.fiveAngas')}</Text>
          <AngaRow
            label={t('panchang.tithi')}
            value={tx(p.tithi.name)}
            sub={`${tx(p.paksha)} · ${tx(endsLabel(now, p.tithi.endsAt))}`.replace(/ · $/, '')}
          />
          <View style={styles.divider} />
          <AngaRow label={t('panchang.nakshatra')} value={tx(p.nakshatra.name)} sub={tx(endsLabel(now, p.nakshatra.endsAt))} />
          <View style={styles.divider} />
          <AngaRow label={t('panchang.yoga')} value={tx(p.yoga.name)} />
          <View style={styles.divider} />
          <AngaRow label={t('panchang.karana')} value={tx(p.karana.name)} />
          <View style={styles.divider} />
          <AngaRow label={t('panchang.vara')} value={`${tx(p.vara.name)} (${tx(p.vara.english)})`} sub={t('panchang.lordValue', { lord: tx(p.vara.lord) })} />
        </View>

        {/* Sun timings */}
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>{t('panchang.sunHeader')}</Text>
          <View style={styles.sunRow}>
            <View style={styles.sunItem}>
              <Sunrise size={20} color="#E8C87E" />
              <Text style={styles.sunLabel}>{t('label.sunrise')}</Text>
              <Text style={styles.sunValue}>{fmt(p.sunrise)}</Text>
            </View>
            <View style={styles.sunDivider} />
            <View style={styles.sunItem}>
              <Sunset size={20} color="#E8C87E" />
              <Text style={styles.sunLabel}>{t('label.sunset')}</Text>
              <Text style={styles.sunValue}>{fmt(p.sunset)}</Text>
            </View>
          </View>
        </View>

        {/* Inauspicious periods */}
        <View style={styles.card}>
          <View style={styles.kalamHead}>
            <AlertTriangle size={16} color="#D9A441" />
            <Text style={styles.cardEyebrowInline}>{t('panchang.inauspicious')}</Text>
          </View>
          <Text style={styles.kalamNote}>
            {t('panchang.kalamNote')}
          </Text>
          <KalamRow period={p.rahuKalam} danger />
          <KalamRow period={p.yamaganda} />
          <KalamRow period={p.gulika} />
        </View>

        <Text style={styles.disclaimer}>
          {t('panchang.disclaimer')}
        </Text>
      </ScrollView>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#8B88A0', textAlign: 'center', lineHeight: 20 },
  dateLine: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  pakshaLine: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#C7C4D6',
    marginTop: 4,
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardEyebrow: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#8B88A0',
    letterSpacing: 2,
    marginBottom: 12,
  },
  cardEyebrowInline: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#8B88A0',
    letterSpacing: 2,
  },
  angaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 12,
  },
  angaLabel: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#C7C4D6' },
  angaValueWrap: { alignItems: 'flex-end', flexShrink: 1 },
  angaValue: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    textAlign: 'right',
  },
  angaSub: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#8B88A0', marginTop: 2, textAlign: 'right' },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)' },
  sunRow: { flexDirection: 'row', alignItems: 'center' },
  sunItem: { flex: 1, alignItems: 'center', gap: 6 },
  sunDivider: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  sunLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#8B88A0',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sunValue: { fontSize: 18, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  kalamHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  kalamNote: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#8B88A0', marginBottom: 10, lineHeight: 17 },
  kalamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  kalamRowDanger: {
    backgroundColor: 'rgba(217, 164, 65, 0.08)',
    borderColor: 'rgba(217, 164, 65, 0.4)',
  },
  kalamName: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#C7C4D6' },
  kalamNameDanger: { color: '#F4F1E8', fontFamily: 'Inter-SemiBold' },
  kalamTime: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#F4F1E8' },
  kalamTimeDanger: { color: '#D9A441' },
  disclaimer: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#8B88A0',
    lineHeight: 16,
    marginTop: 8,
    textAlign: 'center',
  },
});
