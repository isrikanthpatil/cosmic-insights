import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { Sparkles, Eye, EyeOff } from 'lucide-react-native';
import { useAuth, Profile } from '@/contexts/AuthContext';
import { pb } from '@/utils/pocketbase';
import { SecurityUtils } from '@/utils/security';
import { notify } from '@/utils/notify';
import { showToast } from '@/utils/toast';
import { tap } from '@/utils/haptics';
import { searchPlaces } from '@/utils/places';
import DateField from '@/components/DateField';
import TimeField from '@/components/TimeField';
import ScreenBackground from '@/components/ScreenBackground';

type Mode = 'login' | 'signup';

export default function AuthScreen() {
  const { signIn, signUp, requestPasswordReset, user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [submitting, setSubmitting] = useState(false);

  // When used as the modal `login` route, dismiss it once the user becomes
  // authenticated. The hard gate is gone, so this is the screen's only exit.
  useEffect(() => {
    if (user && router.canGoBack()) {
      router.back();
    }
  }, [user, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handlePlaceSearch = (text: string) => {
    // Update the input immediately so typing stays responsive.
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

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setShowPlaceSuggestions(false);
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !SecurityUtils.validateEmail(trimmedEmail)) {
      notify('Reset Password', 'Enter your email address above first, then tap "Forgot password?" again.');
      return;
    }
    try {
      setSubmitting(true);
      await requestPasswordReset(trimmedEmail);
      showToast(`If an account exists for ${trimmedEmail}, a reset link has been sent.`, 'info');
    } catch (error: any) {
      const message =
        error?.response?.message ||
        SecurityUtils.handleSecureError(error, 'auth');
      notify('Reset Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    tap();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      notify('Error', 'Please enter your email and password');
      return;
    }
    if (!SecurityUtils.validateEmail(trimmedEmail)) {
      notify('Error', 'Please enter a valid email address');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      notify('Error', 'Password must be at least 8 characters long');
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
        notify('Error', 'Please fill in all required fields');
        return;
      }

      if (!SecurityUtils.validateName(sanitizedProfile.firstName)) {
        notify('Error', 'Please enter a valid first name');
        return;
      }
      if (!SecurityUtils.validateName(sanitizedProfile.lastName)) {
        notify('Error', 'Please enter a valid last name');
        return;
      }
      if (!SecurityUtils.validatePlace(sanitizedProfile.placeOfBirth)) {
        notify('Error', 'Please enter a valid place of birth');
        return;
      }

      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(sanitizedProfile.dateOfBirth)) {
        notify('Error', 'Please enter date in DD/MM/YYYY format');
        return;
      }

      if (
        sanitizedProfile.timeOfBirth &&
        !SecurityUtils.validateTime(sanitizedProfile.timeOfBirth)
      ) {
        notify('Error', 'Please enter time in HH:MM (24-hour) format');
        return;
      }

      await signUp(trimmedEmail, password, sanitizedProfile);
    } catch (error: any) {
      if (mode === 'signup') {
        // Avoid account enumeration: never surface the raw server message
        // (e.g. "email already exists") on the sign-up path.
        notify(
          'Sign Up Failed',
          'Could not create your account. Please check your details and try again.'
        );
      } else {
        const message =
          error?.response?.message ||
          SecurityUtils.handleSecureError(error, 'auth');
        notify('Sign In Failed', message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    tap();
    try {
      setSubmitting(true);
      await pb.collection('users').authWithOAuth2({
        provider: 'google',
        urlCallback:
          Platform.OS === 'web'
            ? undefined
            : async (url: string) => {
                await WebBrowser.openAuthSessionAsync(url, 'cosmic-insights://');
              },
      });
      // No manual navigation needed; AuthContext reacts to authStore change.
    } catch (error: any) {
      const rawMessage =
        error?.response?.message || error?.message || '';
      // User closed/cancelled the popup — fail quietly, no scary error.
      if (/cancel|closed/i.test(rawMessage)) {
        return;
      }
      const message = rawMessage || SecurityUtils.handleSecureError(error, 'auth');
      notify('Google Sign-In Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenBackground style={styles.container}>
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
              <Sparkles size={40} color="#E8C87E" />
            </View>
            <Text style={styles.brandTitle}>Astropanth</Text>
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
                placeholderTextColor="#7E7B92"
                selectionColor="#E8C87E"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                maxLength={254}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#7E7B92"
                  selectionColor="#E8C87E"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  maxLength={100}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((s) => !s)}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#C7C4D6" />
                  ) : (
                    <Eye size={20} color="#C7C4D6" />
                  )}
                </TouchableOpacity>
              </View>
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
                    placeholderTextColor="#7E7B92"
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

            {mode === 'login' && (
              <TouchableOpacity
                style={styles.forgotButton}
                onPress={handleForgotPassword}
                disabled={submitting}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogle}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size={20} color="#1A1A2E" />
              ) : (
                <>
                  <Text style={styles.googleG}>G</Text>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
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
    </ScreenBackground>
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
    paddingTop: 56,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(232, 200, 126, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  brandSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F4F1E8',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8C87E',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#0B0B1A',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#7E7B92',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  googleG: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A2E',
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#E8C87E',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
  },
  switchTextAccent: {
    color: '#E8C87E',
    fontFamily: 'Inter-SemiBold',
  },
});
