import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { User, CreditCard as Edit3, Save, X, Calendar, Clock, MapPin, Users, LogOut, Settings, Info, Bell, KeyRound, Trash2, UserPlus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { searchPlaces } from '@/utils/places';
import { SecurityUtils } from '@/utils/security';
import { notify, confirmAction } from '@/utils/notify';
import { showToast } from '@/utils/toast';
import {
  enableDailyHoroscopeReminder,
  disableDailyHoroscopeReminder,
} from '@/utils/notifications';
import { tap, success } from '@/utils/haptics';
import { useAuth, Profile as UserProfile } from '@/contexts/AuthContext';
import { useChart } from '@/contexts/ChartContext';
import { pb } from '@/utils/pocketbase';
import DateField from '@/components/DateField';
import TimeField from '@/components/TimeField';
import ScreenBackground from '@/components/ScreenBackground';

const NOTIFICATIONS_KEY = 'settings_notifications';

export default function Profile() {
  const router = useRouter();
  const { profile, user, isLoading: loading, updateProfile, signOut, requestPasswordReset } = useAuth();
  const { isGuest, guestProfile } = useChart();
  const userProfile = profile;
  const profileComplete =
    !!profile &&
    !!profile.firstName &&
    !!profile.lastName &&
    !!profile.dateOfBirth &&
    !!profile.placeOfBirth;
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    gender: 'male'
  });
  const [placeSuggestions, setPlaceSuggestions] = useState<string[]>([]);
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Load the persisted daily-horoscope reminder preference on mount.
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
        if (stored !== null) {
          setNotificationsEnabled(stored === 'true');
        }
      } catch {
        // Ignore read errors; default to off.
      }
    })();
  }, []);

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);

    if (value) {
      // Schedule the daily local reminder. If permission is denied (or the
      // platform is unsupported), revert the toggle and inform the user.
      const enabled = await enableDailyHoroscopeReminder();
      if (!enabled) {
        setNotificationsEnabled(false);
        try {
          await AsyncStorage.setItem(NOTIFICATIONS_KEY, 'false');
        } catch {
          // Non-critical.
        }
        showToast(
          'Enable notifications permission to get daily horoscope reminders.',
          'info'
        );
        return;
      }
    } else {
      await disableDailyHoroscopeReminder();
    }

    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, value ? 'true' : 'false');
    } catch {
      // Non-critical: the toggle still reflects in-session.
    }
  };

  const handleChangePassword = async () => {
    tap();
    const email = user?.email;
    if (!email) {
      notify('Change Password', 'No email address is associated with your account.');
      return;
    }
    try {
      await requestPasswordReset(email);
      showToast(`Password reset link sent to ${email}`, 'info');
    } catch (error: any) {
      const message =
        error?.response?.message ||
        SecurityUtils.handleSecureError(error, 'auth');
      notify('Error', message);
    }
  };

  const handleDeleteAccount = () => {
    confirmAction(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      async () => {
        try {
          await pb.collection('users').delete(user.id);
          signOut();
        } catch (error: any) {
          const message =
            error?.response?.message ||
            SecurityUtils.handleSecureError(error, 'profile');
          notify('Error', message);
        }
      },
      'Delete'
    );
  };

  useEffect(() => {
    // Populate the edit form from the authenticated profile. If the profile
    // is missing required fields, start in editing mode so the user can
    // complete it.
    if (profile) {
      setEditForm(profile);
    }
    // Only auto-open the editor for authenticated users with an incomplete
    // profile. Guests see the sign-up state instead (no editable account UI).
    if (!loading && !isGuest && !profileComplete) {
      setIsEditing(true);
    }
  }, [profile, loading, profileComplete, isGuest]);

  const saveProfile = async () => {
    tap();
    try {
      setSaving(true);

      // Validate required fields
      if (!editForm.firstName.trim() || !editForm.lastName.trim() ||
          !editForm.dateOfBirth.trim() || !editForm.placeOfBirth.trim()) {
        notify('Error', 'Please fill in all required fields');
        return;
      }

      // Sanitize inputs
      const sanitizedProfile: UserProfile = {
        firstName: SecurityUtils.sanitizeInput(editForm.firstName.trim()),
        lastName: SecurityUtils.sanitizeInput(editForm.lastName.trim()),
        dateOfBirth: SecurityUtils.sanitizeInput(editForm.dateOfBirth.trim()),
        timeOfBirth: SecurityUtils.sanitizeInput(editForm.timeOfBirth.trim()),
        placeOfBirth: SecurityUtils.sanitizeInput(editForm.placeOfBirth.trim()),
        gender: editForm.gender
      };

      // Validate inputs
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

      // Validate date format (DD/MM/YYYY)
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(sanitizedProfile.dateOfBirth)) {
        notify('Error', 'Please enter date in DD/MM/YYYY format');
        return;
      }

      // Validate time format if provided (HH:MM AM/PM)
      if (sanitizedProfile.timeOfBirth && !SecurityUtils.validateTime(sanitizedProfile.timeOfBirth)) {
        notify('Error', 'Please enter time in HH:MM (24-hour) format');
        return;
      }

      // Save to PocketBase via the auth context
      await updateProfile(sanitizedProfile);

      setIsEditing(false);
      success();
      showToast('Profile saved successfully!', 'success');

    } catch (error: any) {
      console.error('Error saving profile:', error);
      const message =
        error?.response?.message ||
        SecurityUtils.handleSecureError(error, 'profile');
      notify('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    tap();
    confirmAction(
      'Sign Out',
      'Are you sure you want to sign out?',
      () => signOut(),
      'Sign Out'
    );
  };

  const cancelEdit = () => {
    if (userProfile && profileComplete) {
      setEditForm(userProfile);
      setIsEditing(false);
    } else {
      // If profile is incomplete, keep in editing mode
      setEditForm(
        userProfile ?? {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          timeOfBirth: '',
          placeOfBirth: '',
          gender: 'male'
        }
      );
    }
    setShowPlaceSuggestions(false);
  };

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
    setEditForm({ ...editForm, placeOfBirth: text });

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
    setEditForm({ ...editForm, placeOfBirth: place });
    setShowPlaceSuggestions(false);
    setPlaceSuggestions([]);
  };

  if (loading) {
    return (
      <ScreenBackground style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8C87E" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.headerActions}>
          {!isGuest && profileComplete && !isEditing && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setIsEditing(true)}
            >
              <Edit3 size={20} color="#E8C87E" />
            </TouchableOpacity>
          )}
          {!isGuest && (
            <TouchableOpacity
              style={[styles.headerButton, styles.clearButton]}
              onPress={handleSignOut}
            >
              <LogOut size={20} color="#FF6B6B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {isGuest ? (
            <View style={styles.guestContainer}>
              <View style={styles.avatarContainer}>
                <User size={48} color="#E8C87E" />
              </View>
              <Text style={styles.noProfileTitle}>Create an account to save your details</Text>
              <Text style={styles.noProfileText}>
                {guestProfile
                  ? 'Your birth details are saved on this device. Sign in or create an account to save them to the cloud and unlock unlimited AskAstro.'
                  : 'Sign in or create a free account to save your birth details across devices and unlock unlimited AskAstro.'}
              </Text>

              {guestProfile && (
                <View style={styles.guestDetails}>
                  <View style={styles.detailItem}>
                    <User size={20} color="#E8C87E" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Name</Text>
                      <Text style={styles.detailValue}>
                        {guestProfile.firstName} {guestProfile.lastName}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Calendar size={20} color="#E8C87E" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Date of Birth</Text>
                      <Text style={styles.detailValue}>{guestProfile.dateOfBirth}</Text>
                    </View>
                  </View>
                  {!!guestProfile.timeOfBirth && (
                    <View style={styles.detailItem}>
                      <Clock size={20} color="#E8C87E" />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Time of Birth</Text>
                        <Text style={styles.detailValue}>{guestProfile.timeOfBirth}</Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.detailItem}>
                    <MapPin size={20} color="#E8C87E" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Place of Birth</Text>
                      <Text style={styles.detailValue}>{guestProfile.placeOfBirth}</Text>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.guestSignInButton}
                onPress={() => {
                  tap();
                  router.push('/login');
                }}
                activeOpacity={0.85}
              >
                <UserPlus size={20} color="#0B0B1A" />
                <Text style={styles.createProfileButtonText}>Sign in / Sign up</Text>
              </TouchableOpacity>

              {/* About */}
              <View style={styles.guestAboutCard}>
                <View style={styles.cardTitleRow}>
                  <Info size={18} color="#E8C87E" />
                  <Text style={styles.cardTitle}>About</Text>
                </View>
                <Text style={styles.aboutAppName}>Astropanth</Text>
                <Text style={styles.aboutVersion}>Version 1.0.0</Text>
                <Text style={styles.aboutDescription}>
                  Personalized astrology & numerology guidance.
                </Text>
                <Text style={styles.aboutDisclaimer}>
                  Readings are for guidance and entertainment.
                </Text>
              </View>
            </View>
          ) : !profileComplete && !isEditing ? (
            <View style={styles.noProfileContainer}>
              <User size={64} color="#E8C87E" />
              <Text style={styles.noProfileTitle}>No Profile Found</Text>
              <Text style={styles.noProfileText}>
                Create your profile to get personalized astrology and numerology readings.
              </Text>
              <TouchableOpacity
                style={styles.createProfileButton}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.createProfileButtonText}>Create Profile</Text>
              </TouchableOpacity>
            </View>
          ) : isEditing ? (
            <View style={styles.editContainer}>
              <Text style={styles.sectionTitle}>
                {profileComplete ? 'Edit Profile' : 'Create Profile'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.firstName}
                  onChangeText={(text) => setEditForm({ ...editForm, firstName: text })}
                  placeholder="Enter your first name"
                  placeholderTextColor="#7E7B92"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.lastName}
                  onChangeText={(text) => setEditForm({ ...editForm, lastName: text })}
                  placeholder="Enter your last name"
                  placeholderTextColor="#7E7B92"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date of Birth * (DD/MM/YYYY)</Text>
                <DateField
                  value={editForm.dateOfBirth}
                  onChangeText={(text) => setEditForm({ ...editForm, dateOfBirth: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Time of Birth (HH:MM, 24-hour)</Text>
                <TimeField
                  value={editForm.timeOfBirth ?? ''}
                  onChangeText={(text) => setEditForm({ ...editForm, timeOfBirth: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Place of Birth *</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.placeOfBirth}
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
                      editForm.gender === 'male' && styles.genderButtonActive
                    ]}
                    onPress={() => setEditForm({ ...editForm, gender: 'male' })}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      editForm.gender === 'male' && styles.genderButtonTextActive
                    ]}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      editForm.gender === 'female' && styles.genderButtonActive
                    ]}
                    onPress={() => setEditForm({ ...editForm, gender: 'female' })}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      editForm.gender === 'female' && styles.genderButtonTextActive
                    ]}>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size={20} color="#FFFFFF" />
                  ) : (
                    <>
                      <Save size={20} color="#0B0B1A" />
                      <Text style={styles.saveButtonText}>Save Profile</Text>
                    </>
                  )}
                </TouchableOpacity>

                {profileComplete && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelEdit}
                  >
                    <X size={20} color="#C7C4D6" />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : userProfile ? (
            <View style={styles.profileContainer}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <User size={48} color="#E8C87E" />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {userProfile.firstName} {userProfile.lastName}
                  </Text>
                  <Text style={styles.profileSubtitle}>
                    {userProfile.gender === 'male' ? 'Male' : 'Female'}
                  </Text>
                </View>
              </View>

              <View style={styles.profileDetails}>
                <View style={styles.detailItem}>
                  <Calendar size={20} color="#E8C87E" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Date of Birth</Text>
                    <Text style={styles.detailValue}>{userProfile.dateOfBirth}</Text>
                  </View>
                </View>

                {userProfile.timeOfBirth && (
                  <View style={styles.detailItem}>
                    <Clock size={20} color="#E8C87E" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Time of Birth</Text>
                      <Text style={styles.detailValue}>{userProfile.timeOfBirth}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.detailItem}>
                  <MapPin size={20} color="#E8C87E" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Place of Birth</Text>
                    <Text style={styles.detailValue}>{userProfile.placeOfBirth}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <Users size={20} color="#E8C87E" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Gender</Text>
                    <Text style={styles.detailValue}>
                      {userProfile.gender === 'male' ? 'Male' : 'Female'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Settings */}
              <View style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Settings size={18} color="#E8C87E" />
                  <Text style={styles.cardTitle}>Settings</Text>
                </View>

                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={handleChangePassword}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingIcon}>
                    <KeyRound size={18} color="#E8C87E" />
                  </View>
                  <Text style={styles.settingLabel}>Change Password</Text>
                </TouchableOpacity>

                <View style={styles.settingRow}>
                  <View style={styles.settingIcon}>
                    <Bell size={18} color="#E8C87E" />
                  </View>
                  <Text style={styles.settingLabel}>Daily Horoscope Reminders</Text>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={toggleNotifications}
                    trackColor={{ false: 'rgba(255,255,255,0.10)', true: '#E8C87E' }}
                    thumbColor="#F4F1E8"
                  />
                </View>

                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={handleSignOut}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingIcon}>
                    <LogOut size={18} color="#C7C4D6" />
                  </View>
                  <Text style={styles.settingLabel}>Sign Out</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingRow, styles.settingRowLast]}
                  onPress={handleDeleteAccount}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingIcon}>
                    <Trash2 size={18} color="#FF6B6B" />
                  </View>
                  <Text style={[styles.settingLabel, styles.settingLabelDanger]}>
                    Delete Account
                  </Text>
                </TouchableOpacity>
              </View>

              {/* About */}
              <View style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Info size={18} color="#E8C87E" />
                  <Text style={styles.cardTitle}>About</Text>
                </View>
                <Text style={styles.aboutAppName}>Astropanth</Text>
                <Text style={styles.aboutVersion}>Version 1.0.0</Text>
                <Text style={styles.aboutDescription}>
                  Personalized astrology & numerology guidance.
                </Text>
                <Text style={styles.aboutDisclaimer}>
                  Readings are for guidance and entertainment.
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.10)',
    borderColor: 'rgba(255, 107, 107, 0.35)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 88,
  },
  noProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 20,
  },
  guestContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 18,
  },
  guestDetails: {
    alignSelf: 'stretch',
    gap: 12,
  },
  guestSignInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8C87E',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  guestAboutCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  noProfileTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  noProfileText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  createProfileButton: {
    backgroundColor: '#E8C87E',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  createProfileButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#0B0B1A',
  },
  editContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    marginBottom: 10,
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
  buttonContainer: {
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8C87E',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#0B0B1A',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#C7C4D6',
  },
  profileContainer: {
    gap: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    padding: 16,
    borderRadius: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(232, 200, 126, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
  },
  profileDetails: {
    gap: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    padding: 12,
    borderRadius: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#7E7B92',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F4F1E8',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 16,
    padding: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#F4F1E8',
  },
  settingLabelDanger: {
    color: '#FF6B6B',
  },
  aboutAppName: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    marginTop: 2,
  },
  aboutVersion: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#E8C87E',
    marginTop: 2,
  },
  aboutDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    marginTop: 6,
    lineHeight: 19,
  },
  aboutDisclaimer: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7E7B92',
    marginTop: 6,
  },
});