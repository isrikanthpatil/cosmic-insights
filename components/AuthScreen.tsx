import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { useAuth, Profile } from '@/contexts/AuthContext';
import { SecurityUtils } from '@/utils/security';
import { searchPlaces } from '@/data/indianPlaces';

type Mode = 'login' | 'signup';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const [placeSuggestions, setPlaceSuggestions] = useState<string[]>([]);
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);

  const handlePlaceSearch = (text: string) => {
    setPlaceOfBirth(text);
    if (text.length >= 2) {
      const suggestions = searchPlaces(text);
      setPlaceSuggestions(suggestions);
      setShowPlaceSuggestions(suggestions.length > 0);
    } else {
      setPlaceSuggestions([]);
      setShowPlaceSuggestions(false);
    }
  };

  const selectPlace = (place: string) => {
    setPlaceOfBirth(place);
    setShowPlaceSuggestions(false);
    setPlaceSuggestions([]);
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setShowPlaceSuggestions(false);
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }
    if (!SecurityUtils.validateEmail(trimmedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setSubmitting(true);

      if (mode === 'login') {
        await signIn(trimmedEmail, password);
        return;
      }

      // Sign up: validate & sanitize profile fields
      const sanitizedProfile: Profile = {
        firstName: SecurityUtils.sanitizeInput(firstName.trim()),
        lastName: SecurityUtils.sanitizeInput(lastName.trim()),
        dateOfBirth: SecurityUtils.sanitizeInput(dateOfBirth.trim()),
        timeOfBirth: SecurityUtils.sanitizeInput(timeOfBirth.trim()),
        placeOfBirth: SecurityUtils.sanitizeInput(placeOfBirth.trim()),
        gender,
      };

      if (
        !sanitizedProfile.firstName ||
        !sanitizedProfile.lastName ||
        !sanitizedProfile.dateOfBirth ||
        !sanitizedProfile.placeOfBirth
      ) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (!SecurityUtils.validateName(sanitizedProfile.firstName)) {
        Alert.alert('Error', 'Please enter a valid first name');
        return;
      }
      if (!SecurityUtils.validateName(sanitizedProfile.lastName)) {
        Alert.alert('Error', 'Please enter a valid last name');
        return;
      }
      if (!SecurityUtils.validatePlace(sanitizedProfile.placeOfBirth)) {
        Alert.alert('Error', 'Please enter a valid place of birth');
        return;
      }

      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(sanitizedProfile.dateOfBirth)) {
        Alert.alert('Error', 'Please enter date in DD/MM/YYYY format');
        return;
      }

      if (
        sanitizedProfile.timeOfBirth &&
        !SecurityUtils.validateTime(sanitizedProfile.timeOfBirth)
      ) {
        Alert.alert('Error', 'Please enter time in HH:MM AM/PM format');
        return;
      }

      await signUp(trimmedEmail, password, sanitizedProfile);
    } catch (error: any) {
      const message =
        error?.response?.message ||
        SecurityUtils.handleSecureError(error, 'auth');
      Alert.alert(
        mode === 'login' ? 'Sign In Failed' : 'Sign Up Failed',
        message
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0F0C29', '#24243e', '#302B63']}
      style={styles.container}
    >
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
          <View style={styles.brandContainer}>
            <View style={styles.brandIcon}>
              <Sparkles size={40} color="#FFD700" />
            </View>
            <Text style={styles.brandTitle}>Cosmic Insights</Text>
            <Text style={styles.brandSubtitle}>
              {mode === 'login'
                ? 'Sign in to access your cosmic blueprint'
                : 'Create an account to begin your journey'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#666"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                maxLength={254}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#666"
                secureTextEntry
                autoCapitalize="none"
                maxLength={100}
              />
            </View>

            {mode === 'signup' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>First Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter your first name"
                    placeholderTextColor="#666"
                    maxLength={50}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Last Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Enter your last name"
                    placeholderTextColor="#666"
                    maxLength={50}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date of Birth * (DD/MM/YYYY)</Text>
                  <TextInput
                    style={styles.input}
                    value={dateOfBirth}
                    onChangeText={setDateOfBirth}
                    placeholder="15/06/1990"
                    placeholderTextColor="#666"
                    maxLength={10}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Time of Birth (HH:MM AM/PM)</Text>
                  <TextInput
                    style={styles.input}
                    value={timeOfBirth}
                    onChangeText={setTimeOfBirth}
                    placeholder="10:30 AM"
                    placeholderTextColor="#666"
                    maxLength={20}
                  />
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
              </>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size={20} color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchButton} onPress={switchMode}>
              <Text style={styles.switchText}>
                {mode === 'login'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <Text style={styles.switchTextAccent}>
                  {mode === 'login' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 60,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  brandIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
  },
  brandSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
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
    flexDirection: 'row',
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
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
  },
  switchTextAccent: {
    color: '#FFD700',
    fontFamily: 'Inter-SemiBold',
  },
});
