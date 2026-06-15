import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getNumerologyReading } from '@/utils/numerology';
import { Hash, Target, Compass, Grid3x3 as Grid3X3, Sparkles, Star, Info, RefreshCw } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChart } from '@/contexts/ChartContext';
import ExploreBar from '@/components/ExploreBar';

export default function Numerology() {
  const router = useRouter();
  const { isLoading: loading } = useAuth();
  const { activeProfile: userProfile, isExploring } = useChart();
  const [numerologyReading, setNumerologyReading] = useState<any>(null);

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
      <LinearGradient
        colors={['#0F0C29', '#24243e', '#302B63']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <Sparkles size={64} color="#FFD700" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!userProfile && !isExploring) {
    return (
      <LinearGradient
        colors={['#0F0C29', '#24243e', '#302B63']}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.exploreBarWrap}>
            <ExploreBar />
          </View>
          <View style={styles.noProfileContainer}>
            <Hash size={64} color="#FFD700" />
            <Text style={styles.noProfileTitle}>Profile Required</Text>
            <Text style={styles.noProfileText}>
              Please set up your profile first to access personalized numerology readings.
            </Text>
            <TouchableOpacity
              style={styles.setupProfileButton}
              onPress={() => {
                router.push('/(tabs)/profile');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.setupProfileButtonText}>Set Up Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (!userProfile || !numerologyReading) {
    return (
      <LinearGradient
        colors={['#0F0C29', '#24243e', '#302B63']}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.exploreBarWrap}>
            <ExploreBar />
          </View>
          <View style={styles.loadingContainer}>
            <Sparkles size={64} color="#FFD700" />
            <Text style={styles.loadingText}>Calculating your numbers...</Text>
          </View>
        </ScrollView>
      </LinearGradient>
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
          <Info size={16} color="#8A2BE2" />
          <Text style={styles.kuaInfoText}>
            Your Birth Number {numerologyReading.birthNumber}, Destiny Number {numerologyReading.destinyNumber}, and Kua Number {kuaNumber} have been added to the grid for enhanced analysis
          </Text>
        </View>

        {originalKuaNumber && (
          <View style={styles.conversionInfo}>
            <RefreshCw size={16} color="#FF9800" />
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
                  ? '#FFD700'
                  : isKuaPosition
                  ? '#8A2BE2'
                  : '#4CAF50';

                return (
                  <View key={colIndex} style={[
                    styles.gridCell,
                    isEmpty && styles.emptyCellBorder,
                    isStrong && styles.strongCellBorder,
                    isKuaPosition && styles.kuaCellBorder
                  ]}>
                    <LinearGradient
                      colors={isEmpty ?
                        ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.1)'] :
                        isStrong ?
                        ['rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.1)'] :
                        isKuaPosition ?
                        ['rgba(138, 43, 226, 0.3)', 'rgba(138, 43, 226, 0.1)'] :
                        ['rgba(76, 175, 80, 0.2)', 'rgba(76, 175, 80, 0.1)']
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
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Present numbers</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFD700' }]} />
            <Text style={styles.legendText}>Strong numbers (2+)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#8A2BE2' }]} />
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
    <LinearGradient
      colors={['#0F0C29', '#24243e', '#302B63']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Numerology Analysis</Text>
        <Text style={styles.subtitle}>Numbers that define {userProfile.firstName}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.exploreBarWrap}>
          <ExploreBar />
        </View>
        <View style={styles.content}>
          <View style={styles.numbersRow}>
            <View style={styles.compactNumberCard}>
              <Hash size={16} color="#FF6B6B" />
              <Text style={styles.compactNumberLabel}>Birth</Text>
              <Text style={styles.compactNumberValue}>{numerologyReading.birthNumber}</Text>
              <Text style={styles.compactNumberMeaning} numberOfLines={2}>
                {numerologyReading.birthNumberMeaning}
              </Text>
            </View>

            <View style={styles.compactNumberCard}>
              <Target size={16} color="#FFD700" />
              <Text style={styles.compactNumberLabel}>Destiny</Text>
              <Text style={styles.compactNumberValue}>{numerologyReading.destinyNumber}</Text>
              <Text style={styles.compactNumberMeaning} numberOfLines={2}>
                {numerologyReading.destinyNumberMeaning}
              </Text>
            </View>

            <View style={styles.compactNumberCard}>
              <Compass size={16} color="#8A2BE2" />
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
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Grid3X3 size={24} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Lo Shu Grid Analysis</Text>
            </View>
            <View style={styles.loshuCard}>
              {renderLoshuGrid()}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sparkles size={24} color="#FF8E53" />
              <Text style={styles.sectionTitle}>Detailed Analysis</Text>
            </View>
            {numerologyReading.loshuAnalysis.length > 0 ? (
              numerologyReading.loshuAnalysis.map((analysis: string, index: number) => (
                <View key={index} style={styles.analysisCard}>
                  <Text style={styles.analysisText}>{analysis}</Text>
                </View>
              ))
            ) : (
              <View style={styles.analysisCard}>
                <Text style={styles.analysisText}>
                  Your grid shows a unique pattern. Each missing or filled position represents different aspects of your personality that can be developed through awareness and practice.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Star size={24} color="#FFD700" />
              <Text style={styles.sectionTitle}>Lucky Numbers</Text>
            </View>
            <View style={styles.luckyNumbers}>
              {numerologyReading.luckyNumbers.map((number: number, index: number) => (
                <View key={index} style={styles.luckyNumberCard}>
                  <Text style={styles.luckyNumber}>{number}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Remedies & Suggestions</Text>
            {numerologyReading.remedies.map((remedy: string, index: number) => (
              <View key={index} style={styles.remedyCard}>
                <Text style={styles.remedyText}>{remedy}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  exploreBarWrap: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  noProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noProfileTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  noProfileText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  setupProfileButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  setupProfileButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginTop: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 12,
    paddingBottom: 100,
  },
  numbersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  compactNumberCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 4,
    minHeight: 120,
  },
  compactNumberLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#B8B8B8',
  },
  compactNumberValue: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
  },
  compactKuaContainer: {
    alignItems: 'center',
  },
  compactOriginalKua: {
    fontSize: 8,
    fontFamily: 'Inter-Regular',
    color: '#FF9800',
    marginTop: 1,
  },
  compactNumberMeaning: {
    fontSize: 9,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    textAlign: 'center',
    lineHeight: 12,
  },
  numberCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  numberCardGradient: {
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  numberLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#B8B8B8',
  },
  numberValue: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
  },
  kuaNumberContainer: {
    alignItems: 'center',
  },
  originalKuaText: {
    fontSize: 9,
    fontFamily: 'Inter-Regular',
    color: '#FF9800',
    marginTop: 2,
  },
  numberMeaning: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    textAlign: 'center',
    lineHeight: 14,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  loshuCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  gridContainer: {
    alignItems: 'center',
  },
  gridTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  gridSubtitle: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
    marginBottom: 8,
  },
  kuaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8A2BE2',
  },
  kuaInfoText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    flex: 1,
  },
  conversionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  conversionInfoText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    flex: 1,
  },
  gridWrapper: {
    gap: 6,
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 6,
  },
  gridCell: {
    width: 88,
    height: 88,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyCellBorder: {
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
    borderStyle: 'dashed',
  },
  strongCellBorder: {
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  kuaCellBorder: {
    borderWidth: 1.5,
    borderColor: '#8A2BE2',
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
    color: '#0F0C29',
  },
  emptyBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
  },
  gridNumber: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  gridNumberEmpty: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  gridElement: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  kuaIndicator: {
    fontSize: 8,
    fontFamily: 'Inter-Bold',
    color: '#8A2BE2',
    letterSpacing: 0.5,
  },
  gridLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 6,
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
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
  },
  analysisCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  analysisText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    lineHeight: 20,
  },
  luckyNumbers: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  luckyNumberCard: {
    width: 44,
    height: 44,
    backgroundColor: '#FFD700',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  luckyNumber: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#0F0C29',
  },
  remedyCard: {
    backgroundColor: 'rgba(255, 142, 83, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8E53',
  },
  remedyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    lineHeight: 20,
  },
});