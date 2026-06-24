import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart, Sparkles, User, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useChart } from '@/contexts/ChartContext';
import { getCoordinatesForPlace } from '@/utils/astrology';
import { computeEphemeris } from '@/utils/jyotish/ephemeris';
import {
  computeAshtakoota,
  AshtakootaResult,
  PersonChart,
  KootaScore,
} from '@/utils/jyotish/ashtakoota';
import { searchPlaces } from '@/utils/places';
import { SecurityUtils } from '@/utils/security';
import { tap } from '@/utils/haptics';
import DateField from '@/components/DateField';
import TimeField from '@/components/TimeField';
import ScreenBackground from '@/components/ScreenBackground';
import SectionHeader from '@/components/SectionHeader';

// Map the engine's 4 bands to a neutral one-line descriptor.
const BAND_DESCRIPTOR: Record<AshtakootaResult['band'], string> = {
  Excellent: 'A strong traditional match across most kootas.',
  Good: 'A favourable match by the classical count.',
  Average: 'A moderate match — some kootas align, others less so.',
  'Not recommended': 'Few kootas align by the classical count.',
};

interface MatchResult {
  result: AshtakootaResult;
  lowConfidence: boolean;
  personAName: string;
  personBName: string;
}

export default function MatchScreen() {
  const router = useRouter();
  const { activeProfile } = useChart();

  // Person B form state.
  const [firstName, setFirstName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');

  const [placeSuggestions, setPlaceSuggestions] = useState<string[]>([]);
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const placeSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);

  useEffect(() => {
    return () => {
      if (placeSearchTimer.current) {
        clearTimeout(placeSearchTimer.current);
      }
    };
  }, []);

  // Person A is the user's own active profile. Usable only with a DOB + place.
  const personAReady = useMemo(
    () =>
      Boolean(
        activeProfile &&
          activeProfile.dateOfBirth &&
          activeProfile.placeOfBirth,
      ),
    [activeProfile],
  );

  const handlePlaceSearch = (text: string) => {
    setPlaceOfBirth(text);
    if (placeSearchTimer.current) {
      clearTimeout(placeSearchTimer.current);
    }
    if (text.trim().length < 2) {
      setPlaceSuggestions([]);
      setShowPlaceSuggestions(false);
      return;
    }
    placeSearchTimer.current = setTimeout(async () => {
      const suggestions = await searchPlaces(text);
      setPlaceSuggestions(suggestions);
      setShowPlaceSuggestions(suggestions.length > 0);
    }, 250);
  };

  const selectPlace = (place: string) => {
    setPlaceOfBirth(place);
    setShowPlaceSuggestions(false);
    setPlaceSuggestions([]);
  };

  const handleCheck = () => {
    tap();
    setError(null);
    setMatch(null);

    if (!activeProfile) return;

    // Validate Person B inputs.
    const bDate = SecurityUtils.sanitizeInput(dateOfBirth.trim());
    const bTime = SecurityUtils.sanitizeInput(timeOfBirth.trim());
    const bPlace = SecurityUtils.sanitizeInput(placeOfBirth.trim());

    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(bDate)) {
      setError("Enter the second person's date of birth in DD/MM/YYYY format.");
      return;
    }
    if (!bPlace || !SecurityUtils.validatePlace(bPlace)) {
      setError("Enter the second person's place of birth.");
      return;
    }
    if (bTime && !SecurityUtils.validateTime(bTime)) {
      setError('Enter the time of birth in HH:MM (24-hour) format.');
      return;
    }

    // Resolve coordinates for both people from their place names.
    const coordsA = getCoordinatesForPlace(activeProfile.placeOfBirth);
    const coordsB = getCoordinatesForPlace(bPlace);

    if (!coordsA) {
      setError(
        `We couldn't find coordinates for your birth place ("${activeProfile.placeOfBirth}"). Try a nearby major city.`,
      );
      return;
    }
    if (!coordsB) {
      setError(
        `We couldn't find coordinates for "${bPlace}". Try a nearby major city.`,
      );
      return;
    }

    try {
      // Run the ephemeris for both people.
      const ephA = computeEphemeris({
        dateOfBirth: activeProfile.dateOfBirth,
        timeOfBirth: activeProfile.timeOfBirth || undefined,
        latitude: coordsA.latitude,
        longitude: coordsA.longitude,
      });
      const ephB = computeEphemeris({
        dateOfBirth: bDate,
        timeOfBirth: bTime || undefined,
        latitude: coordsB.latitude,
        longitude: coordsB.longitude,
      });

      const chartA: PersonChart = {
        nakshatra: ephA.nakshatra,
        moonRashi: ephA.moonRashi,
        marsSiderealLongitude: ephA.marsSiderealLongitude,
        moonSiderealLongitude: ephA.moonSiderealLongitude,
        lagnaRashi: ephA.ascendantRashi ?? undefined,
        gender: activeProfile.gender,
      };
      const chartB: PersonChart = {
        nakshatra: ephB.nakshatra,
        moonRashi: ephB.moonRashi,
        marsSiderealLongitude: ephB.marsSiderealLongitude,
        moonSiderealLongitude: ephB.moonSiderealLongitude,
        lagnaRashi: ephB.ascendantRashi ?? undefined,
        // Person B's gender is the opposite of A for the directional kootas.
        gender: activeProfile.gender === 'male' ? 'female' : 'male',
      };

      // The engine treats `male` as the groom and `female` as the bride for the
      // directional kootas (Varna, Gana). Assign by gender accordingly.
      const male = chartA.gender === 'male' ? chartA : chartB;
      const female = chartA.gender === 'male' ? chartB : chartA;

      const result = computeAshtakoota(male, female);

      setMatch({
        result,
        lowConfidence: ephA.lowConfidence || ephB.lowConfidence,
        personAName: activeProfile.firstName || 'You',
        personBName: firstName.trim() || 'Partner',
      });
    } catch (e) {
      setError(
        'Something went wrong calculating the match. Please double-check the birth details and try again.',
      );
    }
  };

  const resetForm = () => {
    tap();
    setMatch(null);
    setError(null);
  };

  return (
    <ScreenBackground style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => {
            tap();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/more');
            }
          }}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color="#E8C87E" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Compatibility</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heading}>
            <Text style={styles.title}>Compatibility</Text>
            <Text style={styles.subtitle}>
              Kundli matching · Ashtakoota Guna Milan
            </Text>
          </View>

          {!personAReady ? (
            <View style={styles.noticeCard}>
              <AlertCircle size={28} color="#E8C87E" />
              <Text style={styles.noticeTitle}>Add your birth details first</Text>
              <Text style={styles.noticeText}>
                Kundli matching uses your own birth chart as the first person.
                Add your date and place of birth to continue.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  tap();
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(tabs)/profile');
                  }
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Add birth details</Text>
              </TouchableOpacity>
            </View>
          ) : match ? (
            <ResultView match={match} onReset={resetForm} />
          ) : (
            <>
              {/* Person A — read-only from active profile. */}
              <SectionHeader icon={User} title="Person A · You" />
              <View style={styles.personCard}>
                <Text style={styles.personName}>
                  {activeProfile?.firstName || 'Your chart'}
                </Text>
                <Text style={styles.personMeta}>
                  {activeProfile?.dateOfBirth}
                  {activeProfile?.timeOfBirth
                    ? ` · ${activeProfile.timeOfBirth}`
                    : ''}
                </Text>
                <Text style={styles.personMeta}>{activeProfile?.placeOfBirth}</Text>
              </View>

              {/* Person B — form. */}
              <View style={styles.sectionSpacer} />
              <SectionHeader icon={Heart} title="Person B · Partner" />

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name (optional)"
                  placeholderTextColor="#7E7B92"
                  selectionColor="#E8C87E"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date of Birth * (DD/MM/YYYY)</Text>
                <DateField value={dateOfBirth} onChangeText={setDateOfBirth} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Time of Birth (HH:MM, 24-hour)</Text>
                <TimeField value={timeOfBirth} onChangeText={setTimeOfBirth} />
                <Text style={styles.inputHint}>
                  Optional — a birth time improves accuracy.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Place of Birth *</Text>
                <TextInput
                  style={styles.input}
                  value={placeOfBirth}
                  onChangeText={handlePlaceSearch}
                  placeholder="Mumbai, Maharashtra"
                  placeholderTextColor="#7E7B92"
                  selectionColor="#E8C87E"
                  maxLength={200}
                />
                {showPlaceSuggestions && (
                  <View style={styles.suggestionsContainer}>
                    {placeSuggestions.map((place, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => selectPlace(place)}
                      >
                        <Text style={styles.suggestionText}>{place}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {error && (
                <View style={styles.errorCard}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCheck}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Check compatibility</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

// The band drives the hero accent colour.
function bandColor(band: AshtakootaResult['band']): string {
  switch (band) {
    case 'Excellent':
    case 'Good':
      return '#69C779';
    case 'Average':
      return '#E8C87E';
    case 'Not recommended':
      return '#FF6B6B';
  }
}

function ResultView({
  match,
  onReset,
}: {
  match: MatchResult;
  onReset: () => void;
}) {
  const { result, lowConfidence, personAName, personBName } = match;
  const kootas: KootaScore[] = [
    result.varna,
    result.vashya,
    result.tara,
    result.yoni,
    result.grahaMaitri,
    result.gana,
    result.bhakoot,
    result.nadi,
  ];

  const accent = bandColor(result.band);

  return (
    <View>
      {/* Hero card */}
      <View style={[styles.heroCard, { borderColor: accent }]}>
        <Text style={styles.heroNames}>
          {personAName} & {personBName}
        </Text>
        <View style={styles.heroScoreRow}>
          <Text style={styles.heroScore}>{result.total}</Text>
          <Text style={styles.heroScoreMax}> / 36</Text>
        </View>
        <Text style={[styles.heroBand, { color: accent }]}>{result.band}</Text>
        <Text style={styles.heroDescriptor}>
          {BAND_DESCRIPTOR[result.band]}
        </Text>
      </View>

      {lowConfidence && (
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Add birth times for the most precise result. The Moon can change
            nakshatra within a single day, so a missing time lowers confidence.
          </Text>
        </View>
      )}

      {/* Per-koota breakdown */}
      <View style={styles.sectionSpacer} />
      <SectionHeader icon={Sparkles} title="Guna breakdown" />
      <View style={styles.kootaGrid}>
        {kootas.map((k) => (
          <View key={k.name} style={styles.kootaCard}>
            <Text style={styles.kootaName}>{k.name}</Text>
            <Text style={styles.kootaPoints}>
              {k.points} <Text style={styles.kootaMax}>/ {k.max}</Text>
            </Text>
            <Text style={styles.kootaNote} numberOfLines={2}>
              {k.note}
            </Text>
          </View>
        ))}
      </View>

      {/* Dosha flags */}
      <View style={styles.sectionSpacer} />
      <SectionHeader icon={Heart} title="Dosha checks" />
      <View style={styles.badgeRow}>
        <DoshaBadge
          present={result.doshas.nadiDosha}
          presentLabel="Nadi dosha present"
          clearLabel="No Nadi dosha"
        />
        <DoshaBadge
          present={result.doshas.bhakootDosha}
          presentLabel={`Bhakoot dosha${
            result.doshas.bhakootPair ? ` (${result.doshas.bhakootPair})` : ''
          }`}
          clearLabel="No Bhakoot dosha"
        />
        <DoshaBadge
          present={result.doshas.mangalDoshaMale}
          presentLabel="Mangal (groom)"
          clearLabel="No Mangal (groom)"
        />
        <DoshaBadge
          present={result.doshas.mangalDoshaFemale}
          presentLabel="Mangal (bride)"
          clearLabel="No Mangal (bride)"
        />
      </View>
      <Text style={styles.mangalRef}>
        Mangal dosha checked from the {result.doshas.mangalReference}.
      </Text>

      {/* Disclaimer */}
      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerText}>
          Guna Milan is one traditional factor in compatibility, not a verdict —
          consider a full reading.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={onReset}
        activeOpacity={0.85}
      >
        <Text style={styles.secondaryButtonText}>Check another match</Text>
      </TouchableOpacity>
    </View>
  );
}

function DoshaBadge({
  present,
  presentLabel,
  clearLabel,
}: {
  present: boolean;
  presentLabel: string;
  clearLabel: string;
}) {
  return (
    <View
      style={[
        styles.badge,
        present ? styles.badgePresent : styles.badgeClear,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: present ? '#FF6B6B' : '#69C779' },
        ]}
      >
        {present ? presentLabel : clearLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  heading: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
  },
  sectionSpacer: {
    height: 24,
  },
  // Person A card
  personCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  personName: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  personMeta: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
  },
  // Form inputs
  inputGroup: {
    gap: 8,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#E8C87E',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F4F1E8',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  inputHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7E7B92',
  },
  suggestionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    marginTop: 4,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#F4F1E8',
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8C87E',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#0B0B1A',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#E8C87E',
  },
  // Notice / error
  noticeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 14,
  },
  noticeTitle: {
    fontSize: 17,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    textAlign: 'center',
  },
  noticeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    textAlign: 'center',
    lineHeight: 21,
  },
  errorCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.35)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FF6B6B',
    lineHeight: 17,
  },
  // Result — hero
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  heroNames: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#C7C4D6',
    marginBottom: 2,
  },
  heroScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heroScore: {
    fontSize: 56,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  heroScoreMax: {
    fontSize: 22,
    fontFamily: 'Inter-Regular',
    color: '#7E7B92',
  },
  heroBand: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
  },
  heroDescriptor: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 4,
  },
  noteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#D9A441',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  noteText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    lineHeight: 17,
  },
  // Koota grid
  kootaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kootaCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  kootaName: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#7E7B92',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  kootaPoints: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  kootaMax: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7E7B92',
  },
  kootaNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    lineHeight: 16,
  },
  // Dosha badges
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  badgePresent: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderColor: 'rgba(255, 107, 107, 0.35)',
  },
  badgeClear: {
    backgroundColor: 'rgba(105, 199, 121, 0.08)',
    borderColor: 'rgba(105, 199, 121, 0.35)',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  mangalRef: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7E7B92',
    marginTop: 8,
  },
  disclaimerCard: {
    backgroundColor: 'rgba(232, 200, 126, 0.06)',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#E8C87E',
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    lineHeight: 17,
    fontStyle: 'italic',
  },
});
