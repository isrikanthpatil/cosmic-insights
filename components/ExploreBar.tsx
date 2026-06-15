import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { UserPlus, X } from 'lucide-react-native';
import { useChart } from '@/contexts/ChartContext';
import { Profile } from '@/contexts/AuthContext';
import { SecurityUtils } from '@/utils/security';
import { notify } from '@/utils/notify';
import { searchPlaces } from '@/utils/places';
import { tap } from '@/utils/haptics';
import DateField from '@/components/DateField';
import TimeField from '@/components/TimeField';

export default function ExploreBar() {
  const { isExploring, exploreSubject, setExplore, clearExplore } = useChart();

  const [modalVisible, setModalVisible] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const [placeSuggestions, setPlaceSuggestions] = useState<string[]>([]);
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);

  const placeSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (placeSearchTimer.current) {
        clearTimeout(placeSearchTimer.current);
      }
    };
  }, []);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setDateOfBirth('');
    setTimeOfBirth('');
    setPlaceOfBirth('');
    setGender('male');
    setPlaceSuggestions([]);
    setShowPlaceSuggestions(false);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

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

    // Debounce the live PocketBase query by ~250ms.
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

  const handleSubmit = () => {
    tap();
    const sanitized: Profile = {
      firstName: SecurityUtils.sanitizeInput(firstName.trim()),
      lastName: SecurityUtils.sanitizeInput(lastName.trim()),
      dateOfBirth: SecurityUtils.sanitizeInput(dateOfBirth.trim()),
      timeOfBirth: SecurityUtils.sanitizeInput(timeOfBirth.trim()),
      placeOfBirth: SecurityUtils.sanitizeInput(placeOfBirth.trim()),
      gender,
    };

    if (!sanitized.firstName || !sanitized.dateOfBirth || !sanitized.placeOfBirth) {
      notify('Error', 'Please fill in first name, date of birth, and place of birth');
      return;
    }

    if (!SecurityUtils.validateName(sanitized.firstName)) {
      notify('Error', 'Please enter a valid first name');
      return;
    }
    if (sanitized.lastName && !SecurityUtils.validateName(sanitized.lastName)) {
      notify('Error', 'Please enter a valid last name');
      return;
    }
    if (!SecurityUtils.validatePlace(sanitized.placeOfBirth)) {
      notify('Error', 'Please enter a valid place of birth');
      return;
    }

    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(sanitized.dateOfBirth)) {
      notify('Error', 'Please enter date in DD/MM/YYYY format');
      return;
    }

    if (sanitized.timeOfBirth && !SecurityUtils.validateTime(sanitized.timeOfBirth)) {
      notify('Error', 'Please enter time in HH:MM (24-hour) format');
      return;
    }

    setExplore(sanitized);
    closeModal();
  };

  return (
    <>
      {isExploring ? (
        <View style={styles.banner}>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerEyebrow}>Exploring</Text>
            <Text style={styles.bannerTitle} numberOfLines={1}>
              Viewing {exploreSubject?.firstName}'s chart
            </Text>
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              tap();
              clearExplore();
            }}
            activeOpacity={0.7}
          >
            <X size={16} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Back to my chart</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => {
            tap();
            setModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <UserPlus size={18} color="#FFD700" />
          <Text style={styles.exploreButtonText}>🔭 Explore another chart</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalCard}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Explore another chart</Text>
              <TouchableOpacity onPress={closeModal} accessibilityLabel="Close">
                <X size={24} color="#B8B8B8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor="#666"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name (optional)"
                  placeholderTextColor="#666"
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
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Place of Birth *</Text>
                <TextInput
                  style={styles.input}
                  value={placeOfBirth}
                  onChangeText={handlePlaceSearch}
                  placeholder="Mumbai, Maharashtra"
                  placeholderTextColor="#666"
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

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Gender *</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      gender === 'male' && styles.genderButtonActive,
                    ]}
                    onPress={() => setGender('male')}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === 'male' && styles.genderButtonTextActive,
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      gender === 'female' && styles.genderButtonActive,
                    ]}
                    onPress={() => setGender('female')}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === 'female' && styles.genderButtonTextActive,
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>View chart</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  exploreButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderLeftWidth: 4,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerEyebrow: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#FFD700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1A152E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  suggestionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  genderButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#B8B8B8',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#B8B8B8',
  },
});
