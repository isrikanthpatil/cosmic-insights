import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getAstrologyReading, getLocationBasedInsights, getSignDetails } from '@/utils/astrology';
import { Star, Sun, Moon, Heart, TrendingUp, TriangleAlert as AlertTriangle, Sparkles, MapPin, Book, Gem } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

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
  const router = useRouter();
  const { profile: userProfile, isLoading: loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [astrologyData, setAstrologyData] = useState<AstrologyData | null>(null);

  useEffect(() => {
    if (userProfile) {
      generateAstrologyData();
    }
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

  if (!userProfile) {
    return (
      <LinearGradient
        colors={['#0F0C29', '#24243e', '#302B63']}
        style={styles.container}
      >
        <View style={styles.noProfileContainer}>
          <Star size={64} color="#FFD700" />
          <Text style={styles.noProfileTitle}>Profile Required</Text>
          <Text style={styles.noProfileText}>
            Please set up your profile first to access personalized astrology readings.
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
      </LinearGradient>
    );
  }

  if (!astrologyData) {
    return (
      <LinearGradient
        colors={['#0F0C29', '#24243e', '#302B63']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <Sparkles size={64} color="#FFD700" />
          <Text style={styles.loadingText}>Calculating your cosmic blueprint...</Text>
        </View>
      </LinearGradient>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.content}>
            <View style={styles.signCard}>
              <LinearGradient
                colors={['rgba(255, 107, 107, 0.2)', 'rgba(255, 142, 83, 0.2)']}
                style={styles.cardGradient}
              >
                <View style={styles.signHeader}>
                  <Sun size={32} color="#FFD700" />
                  <View style={styles.signInfo}>
                    <Text style={styles.signTitle}>Sun Sign</Text>
                    <Text style={styles.signValue}>{astrologyData.sunSign}</Text>
                    <Text style={styles.signDescription}>Your core identity and life purpose</Text>
                    <Text style={styles.signDates}>
                      {astrologyData.detailedAnalysis.sunSignData.dates}
                    </Text>
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
                <Star size={24} color="#FF6B6B" />
                <Text style={styles.halfCardTitle}>Ascendant</Text>
                <Text style={styles.halfCardValue}>{astrologyData.ascendant}</Text>
                <Text style={styles.halfCardDesc}>How others see you</Text>
                <Text style={styles.halfCardElement}>
                  Ruled by {astrologyData.detailedAnalysis.ascendantData.ruler}
                </Text>
              </View>
            </View>

            {astrologyData.coordinates && (
              <View style={styles.coordinatesCard}>
                <View style={styles.coordinatesHeader}>
                  <MapPin size={20} color="#4CAF50" />
                  <Text style={styles.coordinatesTitle}>Birth Location Influence</Text>
                </View>
                <Text style={styles.coordinatesText}>
                  {userProfile.placeOfBirth} ({astrologyData.coordinates.latitude.toFixed(2)}°N, {astrologyData.coordinates.longitude.toFixed(2)}°E)
                </Text>
                <Text style={styles.coordinatesDescription}>
                  Your birth coordinates add unique celestial influences to your astrological profile
                </Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Integrated Personality Traits</Text>
              <Text style={styles.sectionDescription}>
                Based on your Sun in {astrologyData.sunSign}, Moon in {astrologyData.moonSign}, and {astrologyData.ascendant} Rising
              </Text>
              <View style={styles.traitsList}>
                {astrologyData.traits.map((trait, index) => (
                  <View key={index} style={styles.traitItem}>
                    <Sparkles size={16} color="#FFD700" />
                    <Text style={styles.traitText}>{trait}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Book size={20} color="#8A2BE2" />
                <Text style={styles.sectionTitle}>Astrological Elements</Text>
              </View>
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
                  <Text style={styles.elementValue}>{astrologyData.detailedAnalysis.ascendantData.quality}</Text>
                </View>
              </View>
            </View>

            {astrologyData.locationInsights.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location-Based Cosmic Insights</Text>
                <View style={styles.insightsList}>
                  {astrologyData.locationInsights.map((insight, index) => (
                    <View key={index} style={styles.insightItem}>
                      <Text style={styles.insightText}>{insight}</Text>
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
              <View style={styles.sectionHeader}>
                <TrendingUp size={24} color="#4CAF50" />
                <Text style={styles.sectionTitle}>Your Cosmic Strengths</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Based on authentic astrological knowledge from classical texts and verified sources
              </Text>
              {astrologyData.positivePoints.map((point, index) => (
                <View key={index} style={styles.pointCard}>
                  <Text style={styles.pointText}>{point}</Text>
                </View>
              ))}
              
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
              <View style={styles.sectionHeader}>
                <AlertTriangle size={24} color="#FF9800" />
                <Text style={styles.sectionTitle}>Areas for Conscious Growth</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Understanding these patterns helps you grow and evolve consciously. These are not permanent limitations but opportunities for development.
              </Text>
              {astrologyData.negativePoints.map((point, index) => (
                <View key={index} style={styles.pointCard}>
                  <Text style={styles.pointText}>{point}</Text>
                </View>
              ))}
              
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
              <View style={styles.sectionHeader}>
                <Heart size={24} color="#E91E63" />
                <Text style={styles.sectionTitle}>Sacred Remedies & Practices</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Time-tested remedies from Vedic astrology and ancient wisdom traditions
              </Text>
              {astrologyData.remedies.map((remedy, index) => (
                <View key={index} style={styles.remedyCard}>
                  <Text style={styles.remedyText}>{remedy}</Text>
                </View>
              ))}
              
              <View style={styles.gemstoneCard}>
                <View style={styles.gemstoneHeader}>
                  <Gem size={20} color="#9C27B0" />
                  <Text style={styles.gemstoneTitle}>Recommended Gemstones</Text>
                </View>
                <Text style={styles.gemstoneText}>
                  {astrologyData.detailedAnalysis.sunSignData.gemstones.join(', ')}
                </Text>
                <Text style={styles.gemstoneDescription}>
                  These gemstones resonate with your {astrologyData.sunSign} energy and can enhance your natural qualities.
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

      case 'predictions':
        return (
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cosmic Guidance & Insights</Text>
              <Text style={styles.sectionDescription}>
                Based on your birth chart, planetary positions, and ancient astrological wisdom
              </Text>
              
              <View style={styles.predictionCard}>
                <Text style={styles.predictionTitle}>Current Planetary Influences</Text>
                <Text style={styles.predictionText}>
                  Your {astrologyData.sunSign} Sun is currently being influenced by planetary transits that favor {astrologyData.detailedAnalysis.sunSignData.keywords[0].toLowerCase()} and {astrologyData.detailedAnalysis.sunSignData.keywords[1].toLowerCase()}. Your {astrologyData.moonSign} Moon suggests emotional clarity and {astrologyData.detailedAnalysis.moonSignData.keywords[0].toLowerCase()} are coming into focus.
                </Text>
              </View>

              <View style={styles.predictionCard}>
                <Text style={styles.predictionTitle}>Career & Life Path Guidance</Text>
                <Text style={styles.predictionText}>
                  Your astrological combination suggests success in fields related to {astrologyData.detailedAnalysis.sunSignData.career[0].toLowerCase()}, {astrologyData.detailedAnalysis.sunSignData.career[1].toLowerCase()}, and {astrologyData.detailedAnalysis.sunSignData.career[2].toLowerCase()}. The {astrologyData.ascendant} Rising enhances your ability to present yourself professionally.
                </Text>
              </View>

              <View style={styles.predictionCard}>
                <Text style={styles.predictionTitle}>Health & Wellness Focus</Text>
                <Text style={styles.predictionText}>
                  Pay special attention to {astrologyData.detailedAnalysis.sunSignData.bodyParts[0].toLowerCase()} and {astrologyData.detailedAnalysis.sunSignData.bodyParts[1].toLowerCase()}. {astrologyData.detailedAnalysis.sunSignData.health[0]} Regular practice of the recommended remedies will support your overall well-being.
                </Text>
              </View>

              <View style={styles.predictionCard}>
                <Text style={styles.predictionTitle}>Spiritual Evolution</Text>
                <Text style={styles.predictionText}>
                  Your unique combination of {astrologyData.sunSign}, {astrologyData.moonSign}, and {astrologyData.ascendant} indicates a soul journey focused on developing {astrologyData.detailedAnalysis.sunSignData.keywords[2].toLowerCase()} and {astrologyData.detailedAnalysis.sunSignData.keywords[3].toLowerCase()}. This lifetime offers opportunities for significant spiritual growth and self-realization.
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={['#0F0C29', '#24243e', '#302B63']}
      style={styles.container}
    >
      <View style={styles.header}>
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
            onPress={() => setActiveTab(tab.key)}
          >
            <tab.icon size={20} color={activeTab === tab.key ? '#FFFFFF' : '#B8B8B8'} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  tabContainer: {
    maxHeight: 70,
  },
  tabContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#B8B8B8',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  signCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
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
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#B8B8B8',
    marginBottom: 4,
  },
  signValue: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  signDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    marginBottom: 4,
  },
  signDates: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#FFD700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  halfCardTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#B8B8B8',
  },
  halfCardValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  halfCardDesc: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
    textAlign: 'center',
  },
  halfCardElement: {
    fontSize: 9,
    fontFamily: 'Inter-Regular',
    color: '#FFD700',
    textAlign: 'center',
  },
  coordinatesCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  coordinatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  coordinatesTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#4CAF50',
  },
  coordinatesText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  coordinatesDescription: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
    lineHeight: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  sectionDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
    marginBottom: 12,
    lineHeight: 16,
  },
  traitsList: {
    gap: 8,
  },
  traitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
  },
  traitText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    flex: 1,
  },
  elementsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  elementCard: {
    flex: 1,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  elementLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#8A2BE2',
    marginBottom: 4,
  },
  elementValue: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  insightsList: {
    gap: 8,
  },
  insightItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  insightText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    lineHeight: 18,
  },
  pointCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  pointText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    lineHeight: 20,
  },
  mythologyCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  mythologyTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginBottom: 6,
  },
  mythologyText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  balanceTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FF9800',
    marginBottom: 6,
  },
  balanceText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    lineHeight: 18,
  },
  remedyCard: {
    backgroundColor: 'rgba(233, 30, 99, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E91E63',
  },
  remedyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    lineHeight: 20,
  },
  gemstoneCard: {
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  gemstoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  gemstoneTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#9C27B0',
  },
  gemstoneText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  gemstoneDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    lineHeight: 18,
  },
  mantraCard: {
    backgroundColor: 'rgba(103, 58, 183, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#673AB7',
  },
  mantraTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#673AB7',
    marginBottom: 8,
  },
  mantraText: {
    fontSize: 14,
    fontFamily: 'PlayfairDisplay-Regular',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mantraDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    lineHeight: 18,
    marginTop: 6,
  },
  predictionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  predictionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginBottom: 6,
  },
  predictionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E0E0E0',
    lineHeight: 20,
  },
});