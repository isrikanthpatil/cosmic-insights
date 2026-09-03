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
import { useLanguage } from '@/contexts/LanguageContext';

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
  submitLabel,
  initial,
}: BirthDetailsFormProps) {
  const { t } = useLanguage();
  const resolvedSubmitLabel = submitLabel ?? t('birth.viewChart');
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
      notify(t('common.error'), t('birth.fillRequired'));
      return;
    }

    if (!SecurityUtils.validateName(sanitized.firstName)) {
      notify(t('common.error'), t('birth.invalidFirstName'));
      return;
    }
    if (sanitized.lastName && !SecurityUtils.validateName(sanitized.lastName)) {
      notify(t('common.error'), t('birth.invalidLastName'));
      return;
    }
    if (!SecurityUtils.validatePlace(sanitized.placeOfBirth)) {
      notify(t('common.error'), t('birth.invalidPlace'));
      return;
    }

    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(sanitized.dateOfBirth)) {
      notify(t('common.error'), t('birth.invalidDate'));
      return;
    }

    if (sanitized.timeOfBirth && !SecurityUtils.validateTime(sanitized.timeOfBirth)) {
      notify(t('common.error'), t('birth.invalidTime'));
      return;
    }

    onSubmit(sanitized);
  };

  return (
    <View style={styles.form}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('birth.firstNameLabel')}</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder={t('birth.firstNamePlaceholder')}
          placeholderTextColor="#8B88A0"
          maxLength={50}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('birth.lastNameLabel')}</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder={t('birth.lastNamePlaceholder')}
          placeholderTextColor="#8B88A0"
          maxLength={50}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('birth.dobLabel')}</Text>
        <DateField value={dateOfBirth} onChangeText={setDateOfBirth} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('birth.tobLabel')}</Text>
        <TimeField value={timeOfBirth} onChangeText={setTimeOfBirth} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('birth.pobLabel')}</Text>
        <TextInput
          style={styles.input}
          value={placeOfBirth}
          onChangeText={handlePlaceSearch}
          placeholder={t('birth.pobPlaceholder')}
          placeholderTextColor="#8B88A0"
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
        <Text style={styles.inputLabel}>{t('birth.genderLabel')}</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
            onPress={() => setGender('male')}
            accessibilityRole="button"
            accessibilityLabel={t('common.selectMale')}
            accessibilityState={{ selected: gender === 'male' }}
          >
            <Text
              style={[
                styles.genderButtonText,
                gender === 'male' && styles.genderButtonTextActive,
              ]}
            >
              {t('common.male')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
            onPress={() => setGender('female')}
            accessibilityRole="button"
            accessibilityLabel={t('common.selectFemale')}
            accessibilityState={{ selected: gender === 'female' }}
          >
            <Text
              style={[
                styles.genderButtonText,
                gender === 'female' && styles.genderButtonTextActive,
              ]}
            >
              {t('common.female')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={resolvedSubmitLabel}
      >
        <Text style={styles.submitButtonText}>{resolvedSubmitLabel}</Text>
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
    backgroundColor: '#E8C87E',
    borderColor: '#E8C87E',
  },
  genderButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#C7C4D6',
  },
  genderButtonTextActive: {
    color: '#0B0B1A',
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8C87E',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#0B0B1A',
  },
});
