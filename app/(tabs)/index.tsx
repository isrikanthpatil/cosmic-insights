import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Star,
  Hash,
  MessageCircle,
  Sparkles,
  Sun,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { calculateSunSign, generateDailyHoroscope, DailyHoroscope } from '@/utils/astrology';

export default function Home() {
  const router = useRouter();
  const { profile } = useAuth();

  const sunSign = useMemo(
    () => (profile ? calculateSunSign(profile.dateOfBirth, profile.timeOfBirth) : null),
    [profile]
  );

  const horoscope: DailyHoroscope | null = useMemo(
    () =>
      profile
        ? generateDailyHoroscope(profile.firstName, profile.dateOfBirth, profile.placeOfBirth)
        : null,
    [profile]
  );

  return (
    <LinearGradient
      colors={['#0F0C29', '#24243e', '#302B63']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
              onPress={() => router.push('/(tabs)/profile')}
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
                  <Text style={styles.signValue}>{sunSign}</Text>
                </View>
              </LinearGradient>
            </View>

            {horoscope && (
              <View style={styles.horoscopeCard}>
                <View style={styles.cardHeader}>
                  <Sparkles size={20} color="#FFD700" />
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
                    <Text style={styles.metaValue}>{horoscope.luckyColor}</Text>
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
                onPress={() => router.push('/(tabs)/astrology')}
                activeOpacity={0.8}
              >
                <Star size={26} color="#FFD700" />
                <Text style={styles.quickLabel}>Astrology</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => router.push('/(tabs)/numerology')}
                activeOpacity={0.8}
              >
                <Hash size={26} color="#FF6B6B" />
                <Text style={styles.quickLabel}>Numerology</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => router.push('/(tabs)/askastro')}
                activeOpacity={0.8}
              >
                <MessageCircle size={26} color="#FFD700" />
                <Text style={styles.quickLabel}>AskAstro</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
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
    paddingTop: 60,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
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
    marginBottom: 16,
  },
  signGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  signInfo: {
    flex: 1,
  },
  signLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#B8B8B8',
  },
  signValue: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
  },
  horoscopeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    gap: 14,
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
    marginBottom: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
});
