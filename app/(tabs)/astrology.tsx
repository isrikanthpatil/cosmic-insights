import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getAstrologyReading, getSignDetails, getWesternSunSign } from '@/utils/astrology';
import { resolveAndCache, useCoordsNonce } from '@/utils/coords';
import { Star, Sun, Moon, Heart, TrendingUp, TriangleAlert as AlertTriangle, Sparkles, MapPin, Book, Gem } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChart } from '@/contexts/ChartContext';
import ExploreBar from '@/components/ExploreBar';
import GuestEntryPrompt from '@/components/GuestEntryPrompt';
import LoginNudge from '@/components/LoginNudge';
import ScreenBackground from '@/components/ScreenBackground';
import SectionHeader from '@/components/SectionHeader';
import Skeleton from '@/components/Skeleton';
import ShareCardButton from '@/components/ShareCardButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslatedMap } from '@/utils/i18nContent';
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
  const { t, lang } = useLanguage();
  const [astrologyData, setAstrologyData] = useState<AstrologyData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Precise birthplace coordinates (accurate Ascendant); regenerate when ready.
  const coordsNonce = useCoordsNonce();
  useEffect(() => {
    resolveAndCache(userProfile?.placeOfBirth);
  }, [userProfile?.placeOfBirth]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, coordsNonce]);

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

  // Collect every generated prose string this screen renders so it can be
  // batch-translated for the active language. Must run unconditionally (before
  // any early return); the memo returns [] when there's no reading yet.
  const genStrings = useMemo(() => {
    const out: string[] = [];
    const d = astrologyData;
    if (d) {
      out.push(d.sunSign, d.moonSign, d.ascendant);
      out.push(...(d.traits || []));
      out.push(...(d.positivePoints || []));
      out.push(...(d.negativePoints || []));
      out.push(...(d.remedies || []));
      out.push(...(d.locationInsights || []));
      const da = d.detailedAnalysis || {};
      const sd = da.sunSignData || {};
      const md = da.moonSignData || {};
      const ad = da.ascendantData || {};
      if (sd.mythology) out.push(sd.mythology);
      if (Array.isArray(sd.mantras)) out.push(...sd.mantras);
      if (Array.isArray(sd.gemstones) && sd.gemstones.length) out.push(sd.gemstones.join(', '));
      if (sd.element) out.push(sd.element);
      if (md.element) out.push(md.element);
      if (md.quality) out.push(md.quality);
      if (ad.quality) out.push(ad.quality);
    }
    return out.filter((s) => typeof s === 'string' && s.trim().length > 0);
  }, [astrologyData]);
  const tx = useTranslatedMap(genStrings, lang);

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
              title={t('astrology.guestTitle')}
              message={t('astrology.guestMessage')}
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
              <Text style={styles.skeletonCaption}>{t('astrology.calculating')}</Text>
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
                    <Text style={styles.signTitle}>{t('astrology.sunSign')}</Text>
                    <View style={styles.signValueRow}>
                      <Text style={styles.signValue}>{tx(astrologyData.sunSign)}</Text>
                      <Text style={styles.signGlyph}>{getZodiacGlyph(astrologyData.sunSign)}</Text>
                    </View>
                    <Text style={styles.signDescription}>{t('astrology.sunSignDesc')}</Text>
                    <Text style={styles.signDates}>
                      {t('astrology.vedicSidereal', { dates: astrologyData.detailedAnalysis.sunSignData.dates })}
                    </Text>
                    {(() => {
                      const w = getWesternSunSign(userProfile.dateOfBirth);
                      return w.sign ? (
                        <Text style={styles.westernNote}>
                          {t('astrology.westernTropical', { sign: w.sign, dates: w.dates })}
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
                <Text style={styles.halfCardTitle}>{t('astrology.moonSign')}</Text>
                <Text style={styles.halfCardValue}>{tx(astrologyData.moonSign)}</Text>
                <Text style={styles.halfCardDesc}>{t('astrology.moonEmotional')}</Text>
                <Text style={styles.halfCardElement}>
                  {tx(astrologyData.detailedAnalysis.moonSignData.element)} • {tx(astrologyData.detailedAnalysis.moonSignData.quality)}
                </Text>
              </View>
              <View style={styles.halfCard}>
                <Star size={24} color="#B49BE6" />
                <Text style={styles.halfCardTitle}>{t('astrology.ascendant')}</Text>
                {astrologyData.ascendant ? (
                  <>
                    <Text style={styles.halfCardValue}>{tx(astrologyData.ascendant)}</Text>
                    <Text style={styles.halfCardDesc}>{t('astrology.howOthersSee')}</Text>
                    <Text style={styles.halfCardElement}>
                      {t('astrology.ruledBy', { ruler: astrologyData.detailedAnalysis.ascendantData.ruler })}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.halfCardValue}>—</Text>
                    <Text style={styles.halfCardDesc}>{t('astrology.addBirthTime')}</Text>
                    <Text style={styles.halfCardElement}>{t('astrology.revealLagna')}</Text>
                  </>
                )}
              </View>
            </View>

            {astrologyData.coordinates && (
              <View style={styles.coordinatesCard}>
                <View style={styles.coordinatesHeader}>
                  <MapPin size={20} color="#69C779" />
                  <Text style={styles.coordinatesTitle}>{t('astrology.birthLocation')}</Text>
                </View>
                <Text style={styles.coordinatesText}>
                  {userProfile.placeOfBirth} ({astrologyData.coordinates.latitude.toFixed(2)}°N, {astrologyData.coordinates.longitude.toFixed(2)}°E)
                </Text>
                <Text style={styles.coordinatesDescription}>
                  {t('astrology.locationDesc')}
                </Text>
              </View>
            )}

            <View style={styles.section}>
              <SectionHeader icon={Sparkles} title={t('astrology.traitsTitle')} iconColor="#E8C87E" />
              <Text style={styles.sectionDescription}>
                {t('astrology.traitsBasis', { sun: astrologyData.sunSign, moon: astrologyData.moonSign })}
                {astrologyData.ascendant ? t('astrology.andRising', { sign: astrologyData.ascendant }) : ''}
              </Text>
              <View style={styles.chipGroup}>
                {astrologyData.traits.map((trait, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{tx(trait)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader icon={Book} title={t('astrology.elementsTitle')} iconColor="#B49BE6" />
              <View style={styles.elementsGrid}>
                <View style={styles.elementCard}>
                  <Text style={styles.elementLabel}>{t('astrology.sunElement')}</Text>
                  <Text style={styles.elementValue}>{tx(astrologyData.detailedAnalysis.sunSignData.element)}</Text>
                </View>
                <View style={styles.elementCard}>
                  <Text style={styles.elementLabel}>{t('astrology.moonElement')}</Text>
                  <Text style={styles.elementValue}>{tx(astrologyData.detailedAnalysis.moonSignData.element)}</Text>
                </View>
                <View style={styles.elementCard}>
                  <Text style={styles.elementLabel}>{t('astrology.risingQuality')}</Text>
                  <Text style={styles.elementValue}>
                    {astrologyData.ascendant ? tx(astrologyData.detailedAnalysis.ascendantData.quality) : '—'}
                  </Text>
                </View>
              </View>
            </View>

            {astrologyData.locationInsights.length > 0 && (
              <View style={styles.section}>
                <SectionHeader icon={MapPin} title={t('astrology.locationInsightsTitle')} iconColor="#69C779" />
                <View style={styles.chipGroup}>
                  {astrologyData.locationInsights.map((insight, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{tx(insight)}</Text>
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
              <SectionHeader icon={TrendingUp} title={t('astrology.strengthsTitle')} iconColor="#69C779" />
              <Text style={styles.sectionDescription}>
                {t('astrology.strengthsDesc')}
              </Text>
              <View style={styles.chipGroup}>
                {astrologyData.positivePoints.map((point, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{tx(point)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.mythologyCard}>
                <Text style={styles.mythologyTitle}>{t('astrology.ancientWisdom')}</Text>
                <Text style={styles.mythologyText}>
                  {tx(astrologyData.detailedAnalysis.sunSignData.mythology)}
                </Text>
              </View>
            </View>
          </View>
        );

      case 'negative':
        return (
          <View style={styles.content}>
            <View style={styles.section}>
              <SectionHeader icon={AlertTriangle} title={t('astrology.growthTitle')} iconColor="#D9A441" />
              <Text style={styles.sectionDescription}>
                {t('astrology.growthDesc')}
              </Text>
              <View style={styles.chipGroup}>
                {astrologyData.negativePoints.map((point, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{tx(point)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.balanceCard}>
                <Text style={styles.balanceTitle}>{t('astrology.balanceTitle')}</Text>
                <Text style={styles.balanceText}>
                  {t('astrology.balanceText', { sign: astrologyData.sunSign })}
                </Text>
              </View>
            </View>
          </View>
        );

      case 'remedies':
        return (
          <View style={styles.content}>
            <View style={styles.section}>
              <SectionHeader icon={Heart} title={t('astrology.remediesTitle')} iconColor="#E8C87E" />
              <Text style={styles.sectionDescription}>
                {t('astrology.remediesDesc')}
              </Text>
              <View style={styles.chipGroup}>
                {astrologyData.remedies.map((remedy, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{tx(remedy)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.gemstoneCard}>
                <View style={styles.gemstoneHeader}>
                  <Gem size={20} color="#B49BE6" />
                  <Text style={styles.gemstoneTitle}>{t('astrology.gemstonesTitle')}</Text>
                </View>
                <Text style={styles.gemstoneText}>
                  {tx(astrologyData.detailedAnalysis.sunSignData.gemstones.join(', '))}
                </Text>
                <Text style={styles.gemstoneDescription}>
                  {t('astrology.gemstonesDesc', { sign: astrologyData.sunSign })}
                </Text>
              </View>

              <View style={styles.mantraCard}>
                <Text style={styles.mantraTitle}>{t('astrology.mantrasTitle')}</Text>
                {astrologyData.detailedAnalysis.sunSignData.mantras.map((mantra: string, index: number) => (
                  <Text key={index} style={styles.mantraText}>{tx(mantra)}</Text>
                ))}
                <Text style={styles.mantraDescription}>
                  {t('astrology.mantrasDesc')}
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
              <SectionHeader icon={Sparkles} title={t('astrology.guidanceTitle')} iconColor="#E8C87E" />
              <Text style={styles.sectionDescription}>
                {t('astrology.guidanceDesc')}
              </Text>

              <View style={styles.predictionCard}>
                <Text style={styles.predictionTitle}>{t('astrology.predInfluencesTitle')}</Text>
                <Text style={styles.predictionText}>
                  {t('astrology.predInfluences', {
                    sun: astrologyData.sunSign,
                    k0: lc(sd.keywords?.[0], 'growth'),
                    k1: lc(sd.keywords?.[1], 'balance'),
                    moon: astrologyData.moonSign,
                    k2: lc(md.keywords?.[0], 'intuition'),
                  })}
                </Text>
              </View>

              <View style={styles.predictionCard}>
                <Text style={styles.predictionTitle}>{t('astrology.predCareerTitle')}</Text>
                <Text style={styles.predictionText}>
                  {t('astrology.predCareer', {
                    c0: lc(sd.career?.[0], 'your craft'),
                    c1: lc(sd.career?.[1], 'leadership'),
                    c2: lc(sd.career?.[2], 'creative work'),
                  })}{astrologyData.ascendant ? t('astrology.predCareerRising', { sign: astrologyData.ascendant }) : ''}
                </Text>
              </View>

              <View style={styles.predictionCard}>
                <Text style={styles.predictionTitle}>{t('astrology.predHealthTitle')}</Text>
                <Text style={styles.predictionText}>
                  {t('astrology.predHealth', {
                    b0: lc(sd.bodyParts?.[0], 'overall vitality'),
                    b1: lc(sd.bodyParts?.[1], 'rest'),
                    health: sd.health?.[0] ?? '',
                  })}
                </Text>
              </View>

              <View style={styles.predictionCard}>
                <Text style={styles.predictionTitle}>{t('astrology.predSpiritualTitle')}</Text>
                <Text style={styles.predictionText}>
                  {t('astrology.predSpiritual', {
                    combo: astrologyData.ascendant
                      ? `${astrologyData.sunSign}, ${astrologyData.moonSign}, and ${astrologyData.ascendant}`
                      : `${astrologyData.sunSign} and ${astrologyData.moonSign}`,
                    k2: lc(sd.keywords?.[2], 'wisdom'),
                    k3: lc(sd.keywords?.[3], 'compassion'),
                  })}
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

  const astroAsc = astrologyData.ascendant ? ` · ${astrologyData.ascendant} rising` : '';
  const astroShareData = {
    eyebrow: 'Vedic Astrology',
    title: astrologyData.sunSign,
    subtitle: `Moon ${astrologyData.moonSign}${astroAsc}`,
    body:
      `Sun in ${astrologyData.sunSign}, Moon in ${astrologyData.moonSign}` +
      `${astrologyData.ascendant ? `, ${astrologyData.ascendant} rising` : ''}. ` +
      `${(astrologyData.traits || []).slice(0, 3).join(', ')}.`,
    chips: [
      { label: 'Sun', value: astrologyData.sunSign },
      { label: 'Moon', value: astrologyData.moonSign },
      { label: 'Rising', value: astrologyData.ascendant || '—' },
    ],
  };
  const astroShareMsg =
    `My Astropanth chart ✨ Sun ${astrologyData.sunSign}, Moon ${astrologyData.moonSign}${astrologyData.ascendant ? `, ${astrologyData.ascendant} rising` : ''}\n\n` +
    `Get your free Vedic reading: https://www.astropanth.com`;

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.header, styles.headerRow, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{t('astro.title')}</Text>
          <Text style={styles.subtitle}>{t('astro.subtitle', { name: userProfile.firstName })}</Text>
        </View>
        <ShareCardButton data={astroShareData} message={astroShareMsg} />
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        {[
          { key: 'overview', label: t('astro.tab.overview'), icon: Star },
          { key: 'positive', label: t('astro.tab.strengths'), icon: TrendingUp },
          { key: 'negative', label: t('astro.tab.growth'), icon: AlertTriangle },
          { key: 'remedies', label: t('astro.tab.remedies'), icon: Heart },
          { key: 'predictions', label: t('astro.tab.guidance'), icon: Sparkles },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={t('astrology.viewTab', { label: tab.label })}
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
          {t('astrology.disclaimer')}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextWrap: { flex: 1 },
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