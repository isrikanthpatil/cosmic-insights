import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getAstrologyReading, getSignDetails, getWesternSunSign } from '@/utils/astrology';
import { Star, Sun, Moon, Heart, TrendingUp, TriangleAlert as AlertTriangle, Sparkles, MapPin, Book, Gem } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChart } from '@/contexts/ChartContext';
import ExploreBar from '@/components/ExploreBar';
import GuestEntryPrompt from '@/components/GuestEntryPrompt';
import LoginNudge from '@/components/LoginNudge';
import ScreenBackground from '@/components/ScreenBackground';
import SectionHeader from '@/components/SectionHeader';
import Skeleton from '@/components/Skeleton';
import { getZodiacGlyph } from '@/utils/zodiac';
import { tap } from '@/utils/haptics';

interface AstrologyData {
  sunSign: string;
  moonSign: string;
  ascendant: string;
  traits: string[];
  positivePoints: string[];
  negativePoints: string[];
  remedies: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  locationInsights: string[];
  detailedAnalysis: any;
}

export default function Astrology() {
  const insets = useSafeAreaInsets();
  const { isLoading: loading } = useAuth();
  const { activeProfile: userProfile, isExploring, isGuest } = useChart();
  const [activeTab, setActiveTab] = useState('overview');
  const [astrologyData, setAstrologyData] = useState<AstrologyData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    generateAstrologyData();
    // Brief refresh window so the indicator is visible; reading regenerates
    // synchronously above.
    setTimeout(() => setRefreshing(false), 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  useEffect(() => {
    if (userProfile) {
      generateAstrologyData();
    } else {
      setAstrologyData(null);
    }
    // Return to the Overview tab when the subject changes, so we don't land the
    // new person on, say, the Remedies tab left open for someone else.
    setActiveTab('overview');
  }, [userProfile]);

  const generateAstrologyData = () => {
    if (!userProfile) return;

    // Get comprehensive astrology reading using knowledge base
    const reading = getAstrologyReading(userProfile.dateOfBirth, userProfile.placeOfBirth, userProfile.timeOfBirth);
    
    setAstrologyData({
      sunSign: reading.sunSign,
      moonSign: reading.moonSign,
      ascendant: reading.ascendant,
      traits: reading.traits,
      positivePoints: reading.positivePoints,
      negativePoints: reading.negativePoints,
      remedies: reading.remedies,
      coordinates: reading.coordinates,
      locationInsights: reading.locationInsights,
      detailedAnalysis: reading.detailedAnalysis
    });
  };

  if (!loading && !userProfile && !isExploring) {
    return (
      <ScreenBackground style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.exploreBarWrap, { paddingTop: insets.top + 16 }]}>
            {isGuest && <LoginNudge />}
            <ExploreBar />
          </View>
          <View style={styles.guestEntryWrap}>
            <GuestEntryPrompt
              title="Enter your birth details for a free reading"
              message="Add your birth details to unlock your personalized astrology reading. No account needed."
            />
          </View>
        </ScrollView>
      </ScreenBackground>
    );
  }

  if (loading || !userProfile || !astrologyData) {
    return (
      <ScreenBackground style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.exploreBarWrap, { paddingTop: insets.top + 16 }]}>
            <ExploreBar />
          </View>
          <View style={styles.skeletonWrap}>
            <View style={styles.skeletonCaptionRow}>
              <Sparkles size={18} color="#E8C87E" />
              <Text style={styles.skeletonCaption}>Calculating your cosmic blueprint…</Text>
            </View>

            {/* Sun-sign hero card */}
            <View style={styles.skeletonCard}>
              <Skeleton width={140} height={20} />
              <Skeleton width={'70%'} height={14} style={styles.skeletonGap} />
              <Skeleton width={'50%'} height={12} style={styles.skeletonGapSm} />
            </View>

            {/* Two half cards */}
            <View style={styles.skeletonRow}>
              <View style={[styles.skeletonCard, styles.skeletonHalf]}>
                <Skeleton width={90} height={14} />
                <Skeleton width={'60%'} height={16} style={styles.skeletonGap} />
              </View>
              <View style={[styles.skeletonCard, styles.skeletonHalf]}>
                <Skeleton width={90} height={14} />
                <Skeleton width={'60%'} height={16} style={styles.skeletonGap} />
              </View>
            </View>

            {/* Traits list */}
            <View style={styles.skeletonCard}>
              <Skeleton width={'100%'} height={14} />
              <Skeleton width={'90%'} height={14} style={styles.skeletonGap} />
              <Skeleton width={'95%'} height={14} style={styles.skeletonGap} />
            </View>
          </View>
        </ScrollView>
      </ScreenBackground>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.content}>
            <View style={styles.signCard}>
              <LinearGradient
                colors={['rgba(232, 200, 126, 0.10)', 'rgba(232, 200, 126, 0.03)']}
                style={styles.cardGradient}
              >
                <View style={styles.signHeader}>
                  <Sun size={32} color="#E8C87E" />
                  <View style={styles.signInfo}>
                    <Text style={styles.signTitle}>Sun Sign</Text>
                    <View style={styles.signValueRow}>
                      <Text style={styles.signValue}>{astrologyData.sunSign}</Text>
                      <Text style={styles.signGlyph}>{getZodiacGlyph(astrologyData.sunSign)}</Text>
                    </View>
                    <Text style={styles.signDescription}>Your core identity and life purpose</Text>
                    <Text style={styles.signDates}>
                      Vedic (sidereal): {astrologyData.detailedAnalysis.sunSignData.dates}
                    </Text>
                    {(() => {
                      const w = getWesternSunSign(userProfile.dateOfBirth);
                      return w.sign ? (
                        <Text style={styles.westernNote}>
                          Western (tropical): {w.sign} · {w.dates}
                        </Text>
                      ) : null;
                    })()}
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.row}>
              <View style={styles.halfCard}>
                <Moon size={24} color="#C0C0C0" />
                <Text style={styles.halfCardTitle}>Moon Sign</Text>
                <Text style={styles.halfCardValue}>{astrologyData.moonSign}</Text>
                <Text style={styles.halfCardDesc}>Emotional nature</Text>
                <Text style={styles.halfCardElement}>
                  {astrologyData.detailedAnalysis.moonSignData.element} • {astrologyData.detailedAnalysis.moonSignData.quality}
                </Text>
              </View>
              <View style={styles.halfCard}>
                <Star size={24} color="#B49BE6" />
                <Text style={styles.halfCardTitle}>Ascendant</Text>
                {astrologyData.ascendant ? (
                  <>
                    <Text style={styles.halfCardValue}>{astrologyData.ascendant}</Text>
                    <Text style={styles.halfCardDesc}>How others see you</Text>
                    <Text style={styles.halfCardElement}>
                      Ruled by {astrologyData.detailedAnalysis.ascendantData.ruler}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.halfCardValue}>—</Text>
                    <Text style={styles.halfCardDesc}>Add your birth time</Text>
                    <Text style={styles.halfCardElement}>to reveal your Lagna</Text>
                  </>
                )}
              </View>
            </View>

            {astrologyData.coordinates && (
              <View style={styles.coordinatesCard}>
                <View style={styles.coordinatesHeader}>
                  <MapPin size={20} color="#69C779" />
                  <Text style={styles.coordinatesTitle}>Birth Location</Text>
                </View>
                <Text style={styles.coordinatesText}>
                  {userProfile.placeOfBirth} ({astrologyData.coordinates.latitude.toFixed(2)}°N, {astrologyData.coordinates.longitude.toFixed(2)}°E)
                </Text>
                <Text style={styles.coordinatesDescription}>
                  Used to compute your sidereal (Lahiri) chart — Moon sign, Ascendant, and planetary positions.
                </Text>
              </View>
            )}

            <View style={styles.section}>
              <SectionHeader icon={Sparkles} title="Integrated Personality Traits" iconColor="#E8C87E" />
              <Text style={styles.sectionDescription}>
                Based on your Sun in {astrologyData.sunSign}, Moon in {astrologyData.moonSign}
                {astrologyData.ascendant ? `, and ${astrologyData.ascendant} Rising` : ''}
              </Text>
              <View style={styles.chipGroup}>
                {astrologyData.traits.map((trait, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{trait}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader icon={Book} title="Astrological Elements" iconColor="#B49BE6" />
              <View style={styles.elementsGrid}>
                <View style={styles.elementCard}>
                  <Text style={styles.elementLabel}>Sun Element</Text>
                  <Text style={styles.elementValue}>{astrologyData.detailedAnalysis.sunSignData.element}</Text>
                </View>
                <View style={styles.elementCard}>
                  <Text style={styles.elementLabel}>Moon Element</Text>
                  <Text style={styles.elementValue}>{astrologyData.detailedAnalysis.moonSignData.element}</Text>
                </View>
                <View style={styles.elementCard}>
                  <Text style={styles.elementLabel}>Rising Quality</Text>
                  <Text style={styles.elementValue}>
                    {astrologyData.ascendant ? astrologyData.detailedAnalysis.ascendantData.quality : '—'}
                  </Text>
                </View>
              </View>
            </View>

            {astrologyData.locationInsights.length > 0 && (
              <View style={styles.section}>
                <SectionHeader icon={MapPin} title="Location-Based Cosmic Insights" iconColor="#69C779" />
                <View style={styles.chipGroup}>
                  {astrologyData.locationInsights.map((insight, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{insight}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        );

      case 'positive':
        return (
          <View style={styles.content}>
            <View style={styles.section}>
              <SectionHeader icon={TrendingUp} title="Your Cosmic Strengths" iconColor="#69C779" />
              <Text style={styles.sectionDescription}>
                Based on authentic astrological knowledge from classical texts and verified sources
              </Text>
              <View style={styles.chipGroup}>
                {astrologyData.positivePoints.map((point, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{point}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.mythologyCard}>
                <Text style={styles.mythologyTitle}>Ancient Wisdom</Text>
                <Text style={styles.mythologyText}>
                  {astrologyData.detailedAnalysis.sunSignData.mythology}
                </Text>
              </View>
            </View>
          </View>
        );

      case 'negative':
        return (
          <View style={styles.content}>
            <View style={styles.section}>
              <SectionHeader icon={AlertTriangle} title="Areas for Conscious Growth" iconColor="#D9A441" />
              <Text style={styles.sectionDescription}>
                Understanding these patterns helps you grow and evolve consciously. These are not permanent limitations but opportunities for development.
              </Text>
              <View style={styles.chipGroup}>
                {astrologyData.negativePoints.map((point, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{point}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.balanceCard}>
                <Text style={styles.balanceTitle}>The Path of Balance</Text>
                <Text style={styles.balanceText}>
                  Every challenge contains the seed of growth. Your {astrologyData.sunSign} nature provides the strength to transform these patterns into wisdom.
                </Text>
              </View>
            </View>
          </View>
        );

      case 'remedies':
        return (
          <View style={styles.content}>
            <View style={styles.section}>
              <SectionHeader icon={Heart} title="Sacred Remedies & Practices" iconColor="#E8C87E" />
              <Text style={styles.sectionDescription}>
                Time-tested remedies from Vedic astrology and ancient wisdom traditions
              </Text>
              <View style={styles.chipGroup}>
                {astrologyData.remedies.map((remedy, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{remedy}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.gemstoneCard}>
                <View style={styles.gemstoneHeader}>
                  <Gem size={20} color="#B49BE6" />
                  <Text style={styles.gemstoneTitle}>Recommended Gemstones</Text>
                </View>
                <Text style={styles.gemstoneText}>
                  {astrologyData.detailedAnalysis.sunSignData.gemstones.join(', ')}
                </Text>
                <Text style={styles.gemstoneDescription}>
                  These gemstones resonate with your {astrologyData.sunSign} energy. Gemstones are powerful remedies — some (such as blue sapphire / neelam) can react strongly, so please consult a qualified astrologer before wearing one.
                </Text>
              </View>

              <View style={styles.mantraCard}>
                <Text style={styles.mantraTitle}>Sacred Mantras</Text>
                {astrologyData.detailedAnalysis.sunSignData.mantras.map((mantra: string, index: number) => (
                  <Text key={index} style={styles.mantraText}>{mantra}</Text>
                ))}
                <Text style={styles.mantraDescription}>
                  Chant these mantras during meditation or daily practice for spiritual alignment.
                </Text>
              </View>
            </View>
          </View>
        );

      case 'predictions': {
        const sd = astrologyData.detailedAnalysis.sunSignData;
        const md = astrologyData.detailedAnalysis.moonSignData;
        const lc = (v?: string, fb = ''): string => (v ? String(v).toLowerCase() : fb);
        return (
          <View style={styles.content}>
            <View style={styles.section}>
              <SectionHeader icon={Sparkles} title="Cosmic Guidance & Insights" iconColor="#E8C87E" />
              <Text style={styles.sectionDescription}>
                Based on your birth chart, planetary positions, and ancient astrological wisdom
              </Text>
              
              <View style={styles.predictionCard}>
                <Text style={styles.predictionTitle}>Current Planetary Influences</Text>
                <Text style={styles.predictionText}>
                  Your {astrologyData.sunSign} Sun is currently being influenced by planetary transits that favor {lc(sd.keywords?.[0], 'growth')} and {lc(sd.keywords?.[1], 'balance')}. Your {astrologyData.moonSign} Moon suggests emotional clarity and {lc(md.keywords?.[0], 'intuition')} are coming into focus.
                </Text>
              </View>

              <View style={styles.predictionCard}>
                <Text style={styles.predictionTitle}>Career & Life Path Guidance</Text>
                <Text style={styles.predictionText}>
                  Your astrological combination suggests success in fields related to {lc(sd.career?.[0], 'your craft')}, {lc(sd.career?.[1], 'leadership')}, and {lc(sd.career?.[2], 'creative work')}.{astrologyData.ascendant ? ` The ${astrologyData.ascendant} Rising enhances your ability to present yourself professionally.` : ''}
                </Text>
              </View>

              <View style={styles.predictionCard}>
                <Text style={styles.predictionTitle}>Health & Wellness Focus</Text>
                <Text style={styles.predictionText}>
                  Pay special attention to {lc(sd.bodyParts?.[0], 'overall vitality')} and {lc(sd.bodyParts?.[1], 'rest')}. {sd.health?.[0] ?? ''} Regular practice of the recommended remedies will support your overall well-being.
                </Text>
              </View>

              <View style={styles.predictionCard}>
                <Text style={styles.predictionTitle}>Spiritual Evolution</Text>
                <Text style={styles.predictionText}>
                  Your unique combination of {astrologyData.sunSign}{astrologyData.ascendant ? `, ${astrologyData.moonSign}, and ${astrologyData.ascendant}` : ` and ${astrologyData.moonSign}`} indicates a soul journey focused on developing {lc(sd.keywords?.[2], 'wisdom')} and {lc(sd.keywords?.[3], 'compassion')}. This lifetime offers opportunities for significant spiritual growth and self-realization.
                </Text>
              </View>
            </View>
          </View>
        );
      }

      default:
        return null;
    }
  };

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Astrology Reading</Text>
        <Text style={styles.subtitle}>Ancient wisdom for {userProfile.firstName}</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        {[
          { key: 'overview', label: 'Overview', icon: Star },
          { key: 'positive', label: 'Strengths', icon: TrendingUp },
          { key: 'negative', label: 'Growth', icon: AlertTriangle },
          { key: 'remedies', label: 'Remedies', icon: Heart },
          { key: 'predictions', label: 'Guidance', icon: Sparkles },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={`View ${tab.label}`}
            accessibilityState={{ selected: activeTab === tab.key }}
            onPress={() => {
              tap();
              setActiveTab(tab.key);
            }}
          >
            <tab.icon size={20} color={activeTab === tab.key ? '#E8C87E' : '#6E6B84'} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
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
        {activeTab === 'overview' && (
          <View style={[styles.exploreBarWrap, { paddingTop: insets.top + 16 }]}>
            {isGuest && !isExploring && <LoginNudge />}
            <ExploreBar />
          </View>
        )}
        {renderContent()}
        <Text style={styles.disclaimer}>
          Astropanth offers Vedic astrology for guidance and self-reflection. It is not a substitute for professional medical, financial, or legal advice.
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  exploreBarWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  guestEntryWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#F4F1E8',
    marginTop: 20,
  },
  skeletonWrap: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  skeletonCaptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  skeletonCaption: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
  },
  skeletonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonHalf: {
    flex: 1,
  },
  skeletonGap: {
    marginTop: 10,
  },
  skeletonGapSm: {
    marginTop: 6,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
  },
  tabContainer: {
    maxHeight: 76,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    gap: 12,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  activeTab: {
    borderBottomColor: '#E8C87E',
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6E6B84',
  },
  activeTabText: {
    color: '#E8C87E',
    fontFamily: 'Inter-SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 88,
  },
  signCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
  },
  cardGradient: {
    padding: 16,
  },
  signHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signInfo: {
    flex: 1,
  },
  signTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#E8C87E',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  signValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  signValue: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  signGlyph: {
    fontSize: 26,
    color: '#E8C87E',
    marginTop: -2,
  },
  signDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    marginBottom: 4,
  },
  signDates: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#E8C87E',
  },
  westernNote: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#8B88A0',
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  halfCardTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#8B88A0',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  halfCardValue: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    textAlign: 'center',
  },
  halfCardDesc: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8B88A0',
    textAlign: 'center',
  },
  halfCardElement: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#E8C87E',
    textAlign: 'center',
  },
  coordinatesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 2,
    borderLeftColor: '#69C779',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  coordinatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  coordinatesTitle: {
    fontSize: 17,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#69C779',
  },
  coordinatesText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#F4F1E8',
    marginBottom: 4,
  },
  coordinatesDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8B88A0',
    lineHeight: 17,
  },
  section: {
    marginBottom: 12,
  },
  chipGroup: {
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(232, 200, 126, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(232, 200, 126, 0.55)',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 13.5,
    fontFamily: 'Inter-Regular',
    color: '#D8D5E2',
    lineHeight: 20,
  },
  sectionDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8B88A0',
    marginBottom: 10,
    lineHeight: 17,
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#6E6B84',
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  elementsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  elementCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(180, 155, 230, 0.25)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  elementLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#B49BE6',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    textAlign: 'center',
  },
  elementValue: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#F4F1E8',
  },
  mythologyCard: {
    backgroundColor: 'rgba(232, 200, 126, 0.06)',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E8C87E',
  },
  mythologyTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#E8C87E',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  mythologyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    lineHeight: 21,
    fontStyle: 'italic',
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#D9A441',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  balanceTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#D9A441',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    lineHeight: 21,
  },
  gemstoneCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#B49BE6',
    borderWidth: 1,
    borderColor: 'rgba(180, 155, 230, 0.25)',
  },
  gemstoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  gemstoneTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#B49BE6',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  gemstoneText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#F4F1E8',
    marginBottom: 6,
  },
  gemstoneDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    lineHeight: 21,
  },
  mantraCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#B49BE6',
    borderWidth: 1,
    borderColor: 'rgba(180, 155, 230, 0.25)',
  },
  mantraTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#B49BE6',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  mantraText: {
    fontSize: 15,
    fontFamily: 'PlayfairDisplay-Regular',
    color: '#F4F1E8',
    marginBottom: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mantraDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    lineHeight: 21,
    marginTop: 8,
  },
  predictionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E8C87E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  predictionTitle: {
    fontSize: 17,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    marginBottom: 8,
  },
  predictionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    lineHeight: 21,
  },
});