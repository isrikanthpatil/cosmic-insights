import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getNumerologyReading, MISSING_NUMBER_REMEDIES } from '@/utils/numerology';
import { Hash, Target, Compass, Grid3x3 as Grid3X3, Sparkles, Star, Info, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChart } from '@/contexts/ChartContext';
import ExploreBar from '@/components/ExploreBar';
import GuestEntryPrompt from '@/components/GuestEntryPrompt';
import LoginNudge from '@/components/LoginNudge';
import ScreenBackground from '@/components/ScreenBackground';
import SectionHeader from '@/components/SectionHeader';
import Skeleton from '@/components/Skeleton';

export default function Numerology() {
  const insets = useSafeAreaInsets();
  const { isLoading: loading } = useAuth();
  const { activeProfile: userProfile, isExploring, isGuest } = useChart();
  const [numerologyReading, setNumerologyReading] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Which compact number card (if any) is expanded to show its full meaning.
  const [expandedCard, setExpandedCard] = useState<'birth' | 'destiny' | 'kua' | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    generateNumerologyReading();
    // Brief refresh window so the indicator is visible; reading regenerates
    // synchronously above.
    setTimeout(() => setRefreshing(false), 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  useEffect(() => {
    if (userProfile) {
      generateNumerologyReading();
    } else {
      setNumerologyReading(null);
    }
  }, [userProfile]);

  const generateNumerologyReading = () => {
    if (!userProfile) return;

    const reading = getNumerologyReading(
      userProfile.firstName,
      userProfile.lastName,
      userProfile.dateOfBirth,
      userProfile.gender
    );
    
    setNumerologyReading(reading);
  };

  if (loading) {
    return (
      <ScreenBackground style={styles.container}>
        <View style={styles.loadingContainer}>
          <Sparkles size={64} color="#E8C87E" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ScreenBackground>
    );
  }

  if (!userProfile && !isExploring) {
    return (
      <ScreenBackground style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.exploreBarWrap}>
            {isGuest && <LoginNudge />}
            <ExploreBar />
          </View>
          <View style={styles.guestEntryWrap}>
            <GuestEntryPrompt
              title="Enter your birth details for a free reading"
              message="Add your birth details to unlock your personalized numerology analysis. No account needed."
            />
          </View>
        </ScrollView>
      </ScreenBackground>
    );
  }

  if (!userProfile || !numerologyReading) {
    return (
      <ScreenBackground style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.exploreBarWrap}>
            <ExploreBar />
          </View>
          <View style={styles.skeletonWrap}>
            <View style={styles.skeletonCaptionRow}>
              <Sparkles size={18} color="#E8C87E" />
              <Text style={styles.skeletonCaption}>Calculating your numbers…</Text>
            </View>

            {/* Three number cards */}
            <View style={styles.skeletonRow}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.skeletonCard, styles.skeletonThird]}>
                  <Skeleton width={40} height={12} />
                  <Skeleton width={32} height={24} style={styles.skeletonGap} />
                  <Skeleton width={'90%'} height={10} style={styles.skeletonGapSm} />
                </View>
              ))}
            </View>

            {/* Lo Shu grid placeholder */}
            <View style={styles.skeletonCard}>
              <Skeleton width={160} height={16} />
              <Skeleton width={'100%'} height={120} style={styles.skeletonGap} borderRadius={12} />
            </View>

            {/* Analysis lines */}
            <View style={styles.skeletonCard}>
              <Skeleton width={'100%'} height={14} />
              <Skeleton width={'95%'} height={14} style={styles.skeletonGap} />
              <Skeleton width={'85%'} height={14} style={styles.skeletonGap} />
            </View>
          </View>
        </ScrollView>
      </ScreenBackground>
    );
  }

  const renderLoshuGrid = () => {
    const { loshuGrid, gridMeanings, kuaNumber, originalKuaNumber } = numerologyReading;
    
    // Traditional Lo Shu Grid layout
    // 4 9 2
    // 3 5 7  
    // 8 1 6
    const gridNumbers = [
      [4, 9, 2],
      [3, 5, 7],
      [8, 1, 6]
    ];

    return (
      <View style={styles.gridContainer}>
        <Text style={styles.gridTitle}>Traditional Lo Shu Grid</Text>
        <Text style={styles.gridSubtitle}>Based on FEAT Theory ABC + Kua Number</Text>
        
        <View style={styles.kuaInfo}>
          <Info size={16} color="#B49BE6" />
          <Text style={styles.kuaInfoText}>
            Your Birth Number {numerologyReading.birthNumber}, Destiny Number {numerologyReading.destinyNumber}, and Kua Number {kuaNumber} have been added to the grid for enhanced analysis
          </Text>
        </View>

        {originalKuaNumber && (
          <View style={styles.conversionInfo}>
            <RefreshCw size={16} color="#D9A441" />
            <Text style={styles.conversionInfoText}>
              Kua 5 Conversion: Your calculated Kua was {originalKuaNumber}, converted to {kuaNumber} for {userProfile.gender}s (traditional Feng Shui rule)
            </Text>
          </View>
        )}
        
        <View style={styles.gridWrapper}>
          {gridNumbers.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.gridRow}>
              {row.map((number, colIndex) => {
                const count = loshuGrid[rowIndex][colIndex];
                const meaning = gridMeanings[number];
                const isEmpty = count === 0;
                const isStrong = count > 1;
                const isKuaPosition = number === kuaNumber;
                
                const badgeColor = isStrong
                  ? '#E8C87E'
                  : isKuaPosition
                  ? '#B49BE6'
                  : '#69C779';

                return (
                  <View key={colIndex} style={[
                    styles.gridCell,
                    isEmpty && styles.emptyCellBorder,
                    !isEmpty && styles.presentCellBorder,
                    isStrong && styles.strongCellBorder,
                    isKuaPosition && styles.kuaCellBorder
                  ]}>
                    <LinearGradient
                      colors={isEmpty ?
                        ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.03)'] :
                        isStrong ?
                        ['rgba(232, 200, 126, 0.08)', 'rgba(232, 200, 126, 0.03)'] :
                        isKuaPosition ?
                        ['rgba(180, 155, 230, 0.08)', 'rgba(180, 155, 230, 0.03)'] :
                        ['rgba(105, 199, 121, 0.06)', 'rgba(105, 199, 121, 0.03)']
                      }
                      style={styles.cellGradient}
                    >
                      {count > 0 ? (
                        <View style={[styles.countBadge, { backgroundColor: badgeColor }]}>
                          <Text style={styles.countBadgeText}>{count}</Text>
                        </View>
                      ) : (
                        <View style={styles.emptyBadge} />
                      )}

                      <Text style={[styles.gridNumber, isEmpty && styles.gridNumberEmpty]}>
                        {number}
                      </Text>
                      <Text style={[styles.gridElement, { color: meaning.color }]}>
                        {meaning.element}
                      </Text>

                      {isKuaPosition && (
                        <Text style={styles.kuaIndicator}>Kua</Text>
                      )}
                    </LinearGradient>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.gridLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#69C779' }]} />
            <Text style={styles.legendText}>Present numbers</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#E8C87E' }]} />
            <Text style={styles.legendText}>Strong numbers (2+)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#B49BE6' }]} />
            <Text style={styles.legendText}>Kua number</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF6B6B' }]} />
            <Text style={styles.legendText}>Missing numbers</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Numerology Analysis</Text>
        <Text style={styles.subtitle}>Numbers that define {userProfile.firstName}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
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
        <View style={styles.exploreBarWrap}>
          {isGuest && !isExploring && <LoginNudge />}
          <ExploreBar />
        </View>
        <View style={styles.content}>
          <View style={styles.numbersRow}>
            <TouchableOpacity
              style={[styles.compactNumberCard, expandedCard === 'birth' && styles.compactNumberCardActive]}
              activeOpacity={0.85}
              onPress={() => setExpandedCard((c) => (c === 'birth' ? null : 'birth'))}
              accessibilityLabel="Birth number — tap for full meaning"
            >
              <Hash size={16} color="#69C779" />
              <Text style={styles.compactNumberLabel}>Birth</Text>
              <Text style={styles.compactNumberValue}>{numerologyReading.birthNumber}</Text>
              <Text style={styles.compactNumberMeaning} numberOfLines={3}>
                {numerologyReading.birthNumberMeaning}
              </Text>
              <View style={styles.cardHint}>
                {expandedCard === 'birth' ? (
                  <ChevronUp size={14} color="#7E7B92" />
                ) : (
                  <ChevronDown size={14} color="#7E7B92" />
                )}
                <Text style={styles.cardHintText}>
                  {expandedCard === 'birth' ? 'less' : 'tap for more'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.compactNumberCard, expandedCard === 'destiny' && styles.compactNumberCardActive]}
              activeOpacity={0.85}
              onPress={() => setExpandedCard((c) => (c === 'destiny' ? null : 'destiny'))}
              accessibilityLabel="Destiny number — tap for full meaning"
            >
              <Target size={16} color="#E8C87E" />
              <Text style={styles.compactNumberLabel}>Destiny</Text>
              <Text style={styles.compactNumberValue}>{numerologyReading.destinyNumber}</Text>
              <Text style={styles.compactNumberMeaning} numberOfLines={3}>
                {numerologyReading.destinyNumberMeaning}
              </Text>
              <View style={styles.cardHint}>
                {expandedCard === 'destiny' ? (
                  <ChevronUp size={14} color="#7E7B92" />
                ) : (
                  <ChevronDown size={14} color="#7E7B92" />
                )}
                <Text style={styles.cardHintText}>
                  {expandedCard === 'destiny' ? 'less' : 'tap for more'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.compactNumberCard, expandedCard === 'kua' && styles.compactNumberCardActive]}
              activeOpacity={0.85}
              onPress={() => setExpandedCard((c) => (c === 'kua' ? null : 'kua'))}
              accessibilityLabel="Kua number — tap for full meaning"
            >
              <Compass size={16} color="#B49BE6" />
              <Text style={styles.compactNumberLabel}>Kua</Text>
              <View style={styles.compactKuaContainer}>
                <Text style={styles.compactNumberValue}>{numerologyReading.kuaNumber}</Text>
                {numerologyReading.originalKuaNumber && (
                  <Text style={styles.compactOriginalKua}>
                    (was {numerologyReading.originalKuaNumber})
                  </Text>
                )}
              </View>
              <Text style={styles.compactNumberMeaning} numberOfLines={3}>
                {numerologyReading.kuaNumberMeaning}
              </Text>
              <View style={styles.cardHint}>
                {expandedCard === 'kua' ? (
                  <ChevronUp size={14} color="#7E7B92" />
                ) : (
                  <ChevronDown size={14} color="#7E7B92" />
                )}
                <Text style={styles.cardHintText}>
                  {expandedCard === 'kua' ? 'less' : 'tap for more'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {expandedCard && (
            <View style={styles.expandedPanel}>
              <Text style={styles.expandedTitle}>
                {expandedCard === 'birth'
                  ? `Birth Number ${numerologyReading.birthNumber}`
                  : expandedCard === 'destiny'
                  ? `Destiny Number ${numerologyReading.destinyNumber}`
                  : `Kua Number ${numerologyReading.kuaNumber}`}
              </Text>
              <Text style={styles.expandedText}>
                {expandedCard === 'birth'
                  ? numerologyReading.birthNumberMeaning
                  : expandedCard === 'destiny'
                  ? numerologyReading.destinyNumberMeaning
                  : numerologyReading.kuaNumberMeaning}
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <SectionHeader icon={Grid3X3} title="Lo Shu Grid Analysis" iconColor="#69C779" />
            <View style={styles.loshuCard}>
              {renderLoshuGrid()}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon={Sparkles} title="Detailed Analysis" iconColor="#E8C87E" />
            <View style={styles.analysisCard}>
              {numerologyReading.loshuAnalysis.length > 0 ? (
                numerologyReading.loshuAnalysis.map((analysis: string, index: number) => (
                  <View key={index} style={styles.analysisRow}>
                    <View style={styles.analysisDot} />
                    <Text style={styles.analysisText}>{analysis}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.analysisText}>
                  Your grid shows a unique pattern. Each missing or filled position represents different aspects of your personality that can be developed through awareness and practice.
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon={Star} title="Lucky Numbers" iconColor="#E8C87E" />
            <View style={styles.luckyNumbers}>
              {numerologyReading.luckyNumbers.map((number: number, index: number) => (
                <View key={index} style={styles.luckyNumberCard}>
                  <Text style={styles.luckyNumber}>{number}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon={Star} title="Remedies & Suggestions" iconColor="#E8C87E" />
            <View style={styles.chipGroup}>
              {numerologyReading.remedies.map((remedy: string, index: number) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{remedy}</Text>
                </View>
              ))}
            </View>
          </View>

          {numerologyReading.missingNumbers && numerologyReading.missingNumbers.length > 0 && (
            <View style={styles.section}>
              <SectionHeader icon={Star} title="Remedies for your missing numbers" iconColor="#B49BE6" />
              <View style={styles.missingRemediesCard}>
                {numerologyReading.missingNumbers.map((num: number) => (
                  <View key={num} style={styles.analysisRow}>
                    <View style={styles.analysisDot} />
                    <Text style={styles.analysisText}>{MISSING_NUMBER_REMEDIES[num]}</Text>
                  </View>
                ))}
                <Text style={styles.missingNote}>
                  These are supportive practices; consult a qualified astrologer before adopting gemstone remedies.
                </Text>
              </View>
            </View>
          )}
        </View>
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
    padding: 12,
    gap: 4,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  skeletonThird: {
    flex: 1,
    alignItems: 'center',
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  numbersRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  compactNumberCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    minHeight: 132,
  },
  compactNumberCardActive: {
    borderColor: 'rgba(232, 200, 126, 0.55)',
    backgroundColor: 'rgba(232, 200, 126, 0.06)',
  },
  compactNumberLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#7E7B92',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  cardHintText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#7E7B92',
  },
  expandedPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 6,
  },
  expandedTitle: {
    fontSize: 15,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  expandedText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    lineHeight: 21,
  },
  missingRemediesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#B49BE6',
    borderWidth: 1,
    borderColor: 'rgba(180, 155, 230, 0.25)',
    gap: 12,
  },
  missingNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7E7B92',
    lineHeight: 17,
    fontStyle: 'italic',
    marginTop: 2,
  },
  compactNumberValue: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  compactKuaContainer: {
    alignItems: 'center',
  },
  compactOriginalKua: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#D9A441',
    marginTop: 1,
  },
  compactNumberMeaning: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    textAlign: 'center',
    lineHeight: 16,
  },
  section: {
    marginBottom: 12,
  },
  loshuCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 16,
    padding: 12,
  },
  gridContainer: {
    alignItems: 'center',
  },
  gridTitle: {
    fontSize: 17,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    marginBottom: 2,
  },
  gridSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7E7B92',
    marginBottom: 8,
  },
  kuaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(180, 155, 230, 0.06)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#B49BE6',
  },
  kuaInfoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    flex: 1,
    lineHeight: 16,
  },
  conversionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 152, 0, 0.06)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#D9A441',
  },
  conversionInfoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    flex: 1,
    lineHeight: 16,
  },
  gridWrapper: {
    alignSelf: 'stretch',
    gap: 6,
    marginBottom: 10,
    // Keep the 3-cell grid centered and square-capped on wide screens.
    maxWidth: 88 * 3 + 6 * 2,
    width: '100%',
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 6,
  },
  gridCell: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 88,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  presentCellBorder: {
    borderWidth: 1,
    borderColor: 'rgba(105, 199, 121, 0.45)',
  },
  emptyCellBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.4)',
    borderStyle: 'dashed',
  },
  strongCellBorder: {
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.55)',
  },
  kuaCellBorder: {
    borderWidth: 1,
    borderColor: 'rgba(180, 155, 230, 0.55)',
  },
  cellGradient: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  countBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#0B0B1A',
  },
  emptyBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
  },
  gridNumber: {
    fontSize: 30,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  gridNumberEmpty: {
    color: '#56536A',
  },
  gridElement: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  kuaIndicator: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#B49BE6',
    letterSpacing: 1,
  },
  gridLegend: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7E7B92',
  },
  analysisCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#E8C87E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    gap: 12,
  },
  analysisRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  analysisDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8C87E',
    marginTop: 7,
  },
  analysisText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    lineHeight: 21,
  },
  luckyNumbers: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  luckyNumberCard: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(232, 200, 126, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.45)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  luckyNumber: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#E8C87E',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(232, 200, 126, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.30)',
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
  },
});