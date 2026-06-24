import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { tap } from '@/utils/haptics';
import {
  Sparkles,
  Sun,
  Moon,
  Star,
  LogIn,
} from 'lucide-react-native';
import { useChart } from '@/contexts/ChartContext';
import { calculateSunSign, generateDailyHoroscope, getAstrologyReading, DailyHoroscope } from '@/utils/astrology';
import { getNumerologyReading } from '@/utils/numerology';
import ScreenBackground from '@/components/ScreenBackground';
import GuestEntryPrompt from '@/components/GuestEntryPrompt';
import LoginNudge from '@/components/LoginNudge';
import { getZodiacGlyph } from '@/utils/zodiac';

// Maps a lucky-color name to a displayable swatch hex. Falls back to gold.
const COLOR_MAP: Record<string, string> = {
  red: '#FF6B6B',
  crimson: '#DC143C',
  pink: '#FF8FB1',
  orange: '#FF9800',
  gold: '#FFD700',
  golden: '#FFD700',
  yellow: '#FFE066',
  green: '#4CAF50',
  emerald: '#2ECC71',
  blue: '#2196F3',
  navy: '#1A237E',
  turquoise: '#1ABC9C',
  purple: '#8A2BE2',
  violet: '#7C4DFF',
  white: '#F5F5F5',
  silver: '#C0C0C0',
  grey: '#9E9E9E',
  gray: '#9E9E9E',
  black: '#2B2B2B',
  brown: '#8D6E63',
};

const colorToHex = (name: string): string => {
  if (!name) return '#E8C87E';
  const key = name.trim().toLowerCase();
  if (COLOR_MAP[key]) return COLOR_MAP[key];
  const match = Object.keys(COLOR_MAP).find((c) => key.includes(c));
  return match ? COLOR_MAP[match] : '#E8C87E';
};

export default function Home() {
  const router = useRouter();
  const { activeProfile: profile, isGuest } = useChart();
  const [refreshing, setRefreshing] = useState(false);
  // Bumped on pull-to-refresh to re-derive the daily horoscope.
  const [refreshNonce, setRefreshNonce] = useState(0);

  const sunSign = useMemo(
    () => (profile ? calculateSunSign(profile.dateOfBirth, profile.timeOfBirth) : null),
    [profile]
  );

  const horoscope: DailyHoroscope | null = useMemo(
    () =>
      profile
        ? generateDailyHoroscope(profile.firstName, profile.dateOfBirth, profile.placeOfBirth)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, refreshNonce]
  );

  // Full chart (Sun/Moon/Ascendant) using the same util the Astrology screen uses.
  const chart = useMemo(
    () =>
      profile
        ? getAstrologyReading(profile.dateOfBirth, profile.placeOfBirth, profile.timeOfBirth)
        : null,
    [profile]
  );

  // Core numerology numbers, mirroring the Numerology screen's usage.
  const numbers = useMemo(
    () =>
      profile
        ? getNumerologyReading(
            profile.firstName,
            profile.lastName,
            profile.dateOfBirth,
            profile.gender
          )
        : null,
    [profile]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshNonce((n) => n + 1);
    // Brief refresh window so the indicator is visible; the reading re-derives
    // synchronously via the memo above.
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const goToLogin = () => {
    tap();
    router.push('/login');
  };

  return (
    <ScreenBackground style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E8C87E"
            colors={['#E8C87E']}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.brandIcon}>
            <Sparkles size={28} color="#E8C87E" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              {profile ? `Welcome back, ${profile.firstName}` : 'Welcome to'}
            </Text>
            <Text style={styles.name}>Astropanth</Text>
          </View>
          {isGuest && (
            <TouchableOpacity
              style={styles.signInChip}
              onPress={goToLogin}
              activeOpacity={0.8}
              accessibilityLabel="Sign in"
            >
              <LogIn size={16} color="#E8C87E" />
              <Text style={styles.signInChipText}>Sign in</Text>
            </TouchableOpacity>
          )}
        </View>

        {isGuest && <LoginNudge />}

        {!profile ? (
          <GuestEntryPrompt
            title="Get your free reading"
            message="Enter your birth details to unlock personalized astrology, numerology, and your daily horoscope. No account needed."
          />
        ) : (
          <>
            <Text style={styles.snapshotTitle}>Your chart</Text>
            <View style={styles.chartRow}>
              <View style={styles.chartCard}>
                <Sun size={20} color="#E8C87E" />
                <Text style={styles.chartLabel}>Sun</Text>
                <View style={styles.chartValueRow}>
                  <Text style={styles.chartValue}>{chart?.sunSign ?? sunSign}</Text>
                  {(chart?.sunSign ?? sunSign) ? (
                    <Text style={styles.chartGlyph}>
                      {getZodiacGlyph(chart?.sunSign ?? (sunSign as string))}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.chartCard}>
                <Moon size={20} color="#C0C0C0" />
                <Text style={styles.chartLabel}>Moon</Text>
                <View style={styles.chartValueRow}>
                  <Text style={styles.chartValue}>{chart?.moonSign}</Text>
                  {chart?.moonSign ? (
                    <Text style={styles.chartGlyph}>{getZodiacGlyph(chart.moonSign)}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.chartCard}>
                <Star size={20} color="#B49BE6" />
                <Text style={styles.chartLabel}>Rising</Text>
                <View style={styles.chartValueRow}>
                  <Text style={styles.chartValue}>{chart?.ascendant}</Text>
                  {chart?.ascendant ? (
                    <Text style={styles.chartGlyph}>{getZodiacGlyph(chart.ascendant)}</Text>
                  ) : null}
                </View>
              </View>
            </View>

            {numbers && (
              <>
                <Text style={styles.snapshotTitle}>Your numbers</Text>
                <View style={styles.numbersRow}>
                  <View style={styles.numberChip}>
                    <Text style={styles.numberLabel}>Birth</Text>
                    <Text style={styles.numberValue}>{numbers.birthNumber}</Text>
                  </View>
                  <View style={styles.numberChip}>
                    <Text style={styles.numberLabel}>Destiny</Text>
                    <Text style={styles.numberValue}>{numbers.destinyNumber}</Text>
                  </View>
                  <View style={styles.numberChip}>
                    <Text style={styles.numberLabel}>Kua</Text>
                    <Text style={styles.numberValue}>{numbers.kuaNumber}</Text>
                  </View>
                </View>
              </>
            )}

            {horoscope && (
              <View style={styles.horoscopeCard}>
                <View style={styles.cardHeader}>
                  <Sparkles size={18} color="#E8C87E" />
                  <Text style={styles.cardTitle}>Today's Horoscope</Text>
                </View>
                <Text style={styles.horoscopeText}>{horoscope.mainPrediction}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Lucky Numbers</Text>
                    <Text style={styles.metaValue}>
                      {horoscope.luckyNumbers.join(', ')}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Lucky Color</Text>
                    <View style={styles.colorValueRow}>
                      <View
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: colorToHex(horoscope.luckyColor) },
                        ]}
                      />
                      <Text style={styles.metaValue}>{horoscope.luckyColor}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.adviceBox}>
                  <Text style={styles.adviceLabel}>Advice</Text>
                  <Text style={styles.adviceText}>{horoscope.advice}</Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 32,
    paddingBottom: 88,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  brandIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(232, 200, 126, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
  },
  name: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  signInChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(232, 200, 126, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  signInChipText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#E8C87E',
  },
  snapshotTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#E8C87E',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  chartRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  chartCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
  },
  chartLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#7E7B92',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  chartValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartValue: {
    fontSize: 14,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  chartGlyph: {
    fontSize: 15,
    color: '#E8C87E',
  },
  numbersRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  numberChip: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  numberLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#7E7B92',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  numberValue: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#E8C87E',
  },
  horoscopeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  colorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  horoscopeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 12,
    padding: 12,
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#7E7B92',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  metaValue: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#E8C87E',
  },
  adviceBox: {
    backgroundColor: 'rgba(232, 200, 126, 0.06)',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 2,
    borderLeftColor: '#E8C87E',
  },
  adviceLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#E8C87E',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  adviceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    lineHeight: 21,
  },
});
