import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { tap } from '@/utils/haptics';
import {
  Star,
  Hash,
  MessageCircle,
  Sparkles,
  Sun,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { calculateSunSign, generateDailyHoroscope, DailyHoroscope } from '@/utils/astrology';
import ScreenBackground from '@/components/ScreenBackground';
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
  if (!name) return '#FFD700';
  const key = name.trim().toLowerCase();
  if (COLOR_MAP[key]) return COLOR_MAP[key];
  const match = Object.keys(COLOR_MAP).find((c) => key.includes(c));
  return match ? COLOR_MAP[match] : '#FFD700';
};

export default function Home() {
  const router = useRouter();
  const { profile } = useAuth();
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshNonce((n) => n + 1);
    // Brief refresh window so the indicator is visible; the reading re-derives
    // synchronously via the memo above.
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const goTo = (path: '/(tabs)/astrology' | '/(tabs)/numerology' | '/(tabs)/askastro' | '/(tabs)/profile') => {
    tap();
    router.push(path);
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
            tintColor="#FFD700"
            colors={['#FFD700']}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.brandIcon}>
            <Sparkles size={28} color="#FFD700" />
          </View>
          <View style={styles.headerText}>
            {profile ? (
              <>
                <Text style={styles.greeting}>Welcome back,</Text>
                <Text style={styles.name}>{profile.firstName}</Text>
              </>
            ) : (
              <>
                <Text style={styles.greeting}>Welcome to</Text>
                <Text style={styles.name}>Cosmic Insights</Text>
              </>
            )}
          </View>
        </View>

        {!profile ? (
          <View style={styles.setupCard}>
            <Star size={48} color="#FFD700" />
            <Text style={styles.setupTitle}>Set up your profile</Text>
            <Text style={styles.setupText}>
              Add your birth details to unlock personalized astrology readings,
              numerology insights, and your daily horoscope.
            </Text>
            <TouchableOpacity
              style={styles.setupButton}
              onPress={() => goTo('/(tabs)/profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.setupButtonText}>Set Up Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.signCard}>
              <LinearGradient
                colors={['rgba(255, 107, 107, 0.25)', 'rgba(255, 215, 0, 0.15)']}
                style={styles.signGradient}
              >
                <Sun size={32} color="#FFD700" />
                <View style={styles.signInfo}>
                  <Text style={styles.signLabel}>Your Sun Sign</Text>
                  <View style={styles.signValueRow}>
                    <Text style={styles.signValue}>{sunSign}</Text>
                    {sunSign ? (
                      <Text style={styles.signGlyph}>{getZodiacGlyph(sunSign)}</Text>
                    ) : null}
                  </View>
                </View>
              </LinearGradient>
            </View>

            {horoscope && (
              <View style={styles.horoscopeCard}>
                <View style={styles.cardHeader}>
                  <Sparkles size={18} color="#FFD700" />
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

            <Text style={styles.quickTitle}>Explore</Text>
            <View style={styles.quickRow}>
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => goTo('/(tabs)/astrology')}
                activeOpacity={0.8}
              >
                <Star size={26} color="#FFD700" />
                <Text style={styles.quickLabel}>Astrology</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => goTo('/(tabs)/numerology')}
                activeOpacity={0.8}
              >
                <Hash size={26} color="#FF6B6B" />
                <Text style={styles.quickLabel}>Numerology</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => goTo('/(tabs)/askastro')}
                activeOpacity={0.8}
              >
                <MessageCircle size={26} color="#FFD700" />
                <Text style={styles.quickLabel}>AskAstro</Text>
              </TouchableOpacity>
            </View>

            {sunSign && (
              <View style={styles.tipRow}>
                <Sparkles size={16} color="#FFD700" />
                <Text style={styles.tipText}>
                  The stars align for {sunSign} today. Trust your intuition and
                  embrace what the universe sends your way.
                </Text>
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
    padding: 20,
    paddingTop: 48,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  brandIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
  },
  name: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
  },
  setupCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
  },
  setupTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
  },
  setupText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  setupButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginTop: 4,
  },
  setupButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  signCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  signGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  signInfo: {
    flex: 1,
  },
  signLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#B8B8B8',
  },
  signValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  signValue: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
  },
  signGlyph: {
    fontSize: 26,
    color: '#FFD700',
    marginTop: -2,
  },
  horoscopeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
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
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  horoscopeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#B8B8B8',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
  },
  adviceBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  adviceLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginBottom: 4,
  },
  adviceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    lineHeight: 20,
  },
  quickTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#D8D8D8',
    lineHeight: 17,
  },
  quickLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
});
