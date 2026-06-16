import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Profile } from '@/contexts/AuthContext';
import { SecurityUtils } from '@/utils/security';
import { notify } from '@/utils/notify';
import { searchPlaces } from '@/utils/places';
import { tap } from '@/utils/haptics';
import DateField from '@/components/DateField';
import TimeField from '@/components/TimeField';

interface BirthDetailsFormProps {
  /** Called with a validated, sanitized profile when the form is submitted. */
  onSubmit: (profile: Profile) => void;
  /** Submit button label. */
  submitLabel?: string;
  /** Optional initial values to seed the form. */
  initial?: Partial<Profile>;
}

/**
 * A reusable birth-details form shared by ExploreBar and the guest-entry
 * prompts. Handles place autocomplete, gender toggle, validation and
 * sanitization (firstName/dateOfBirth/placeOfBirth required; DD/MM/YYYY date;
 * optional HH:MM time). On valid submit it invokes `onSubmit` with a Profile.
 */
export default function BirthDetailsForm({
  onSubmit,
  submitLabel = 'View chart',
  initial,
}: BirthDetailsFormProps) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(initial?.dateOfBirth ?? '');
  const [timeOfBirth, setTimeOfBirth] = useState(initial?.timeOfBirth ?? '');
  const [placeOfBirth, setPlaceOfBirth] = useState(initial?.placeOfBirth ?? '');
  const [gender, setGender] = useState<'male' | 'female'>(initial?.gender ?? 'male');

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

    onSubmit(sanitized);
  };

  return (
    <View style={styles.form}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter first name"
          placeholderTextColor="#7E7B92"
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
          placeholderTextColor="#7E7B92"
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
          placeholderTextColor="#7E7B92"
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
            style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
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
            style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
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
        <Text style={styles.submitButtonText}>{submitLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#E8C87E',
    letterSpacing: 2,
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
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  genderButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#C7C4D6',
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
});
