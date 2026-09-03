import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Switch, Modal, Pressable } from 'react-native';
import { User, CreditCard as Edit3, Save, X, Calendar, Clock, MapPin, Users, LogOut, Settings, Info, Bell, KeyRound, Trash2, UserPlus, Sparkles, ChevronRight, Share2, Star, Globe, Check } from 'lucide-react-native';
import Constants from 'expo-constants';
import { shareApp, rateApp } from '@/utils/appShare';
import BrandLogo from '@/components/BrandLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { LOCALIZATION_ENABLED } from '@/constants/plans';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchPlaces } from '@/utils/places';
import { calculateSunSign, calculateMoonSign } from '@/utils/astrology';
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
import { usePremium } from '@/contexts/PremiumContext';
import { pb } from '@/utils/pocketbase';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import DateField from '@/components/DateField';
import TimeField from '@/components/TimeField';
import ScreenBackground from '@/components/ScreenBackground';

const NOTIFICATIONS_KEY = 'settings_notifications';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, user, isLoading: loading, updateProfile, signOut, requestPasswordReset } = useAuth();
  const { isGuest, guestProfile, setGuestProfile } = useChart();
  // Read the real app version so the About card never drifts from the build.
  const appVersion = Constants.expoConfig?.version ?? '1.0.2';
  const { t, lang, setLang, availableLangs } = useLanguage();
  const { isPremium } = usePremium();
  const kb = useKeyboardHeight();
  const scrollViewRef = useRef<ScrollView>(null);
  // Records each edit-field's y offset (via onLayout) so focusing any text
  // field scrolls it consistently clear of the keyboard — like the chat screen.
  const fieldY = useRef<Record<string, number>>({});
  const scrollToField = (name: string) => {
    const y = fieldY.current[name] ?? 0;
    setTimeout(
      () => scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true }),
      120
    );
  };
  const userProfile = profile;
  // Identity flourishes for the profile header: initials + Sun/Moon signs.
  const initials = userProfile
    ? `${(userProfile.firstName || '').charAt(0)}${(userProfile.lastName || '').charAt(0)}`.toUpperCase()
    : '';
  const signSummary = useMemo(() => {
    if (!userProfile) return '';
    try {
      const sun = calculateSunSign(userProfile.dateOfBirth, userProfile.timeOfBirth);
      const moon = calculateMoonSign(userProfile.dateOfBirth, userProfile.placeOfBirth);
      return t('profile.signSummary', { sun, moon });
    } catch {
      return '';
    }
  }, [userProfile]);
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
  const [langModal, setLangModal] = useState(false);

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
          t('profile.notifPermission'),
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
      notify(t('profile.changePassword'), t('profile.noEmail'));
      return;
    }
    try {
      await requestPasswordReset(email);
      showToast(t('profile.resetLinkSent', { email }), 'info');
    } catch (error: any) {
      const message =
        error?.response?.message ||
        SecurityUtils.handleSecureError(error, 'auth');
      notify(t('common.error'), message);
    }
  };

  const handleDeleteAccount = () => {
    if (!user?.id) {
      notify(t('common.error'), t('profile.noAccountDelete'));
      return;
    }
    confirmAction(
      t('profile.deleteAccount'),
      t('profile.deleteConfirm'),
      async () => {
        try {
          await pb.collection('users').delete(user.id);
          signOut();
        } catch (error: any) {
          const message =
            error?.response?.message ||
            SecurityUtils.handleSecureError(error, 'profile');
          notify(t('common.error'), message);
        }
      },
      t('common.delete')
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
        notify(t('common.error'), t('profile.fillRequired'));
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
        notify(t('common.error'), t('profile.invalidFirstName'));
        return;
      }

      if (!SecurityUtils.validateName(sanitizedProfile.lastName)) {
        notify(t('common.error'), t('profile.invalidLastName'));
        return;
      }

      if (!SecurityUtils.validatePlace(sanitizedProfile.placeOfBirth)) {
        notify(t('common.error'), t('profile.invalidPlace'));
        return;
      }

      // Validate date format (DD/MM/YYYY)
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(sanitizedProfile.dateOfBirth)) {
        notify(t('common.error'), t('profile.invalidDate'));
        return;
      }

      // Validate time format if provided (HH:MM AM/PM)
      if (sanitizedProfile.timeOfBirth && !SecurityUtils.validateTime(sanitizedProfile.timeOfBirth)) {
        notify(t('common.error'), t('profile.invalidTime'));
        return;
      }

      // Guests (no authenticated account) save locally — never hit the
      // network, which would 404 because there is no user record to update.
      if (!user?.id) {
        setGuestProfile(sanitizedProfile);
        setIsEditing(false);
        success();
        showToast(t('profile.savedSuccess'), 'success');
        return;
      }

      // Authenticated: save to PocketBase via the auth context. If the session
      // has expired the update 404s / 401s; attempt a single auth refresh and
      // retry before surfacing a clear "sign in again" message.
      try {
        await updateProfile(sanitizedProfile);
      } catch (updateError: any) {
        try {
          await pb.collection('users').authRefresh();
        } catch {
          throw new Error('SESSION_EXPIRED');
        }
        try {
          await updateProfile(sanitizedProfile);
        } catch {
          throw new Error('SESSION_EXPIRED');
        }
      }

      setIsEditing(false);
      success();
      showToast(t('profile.savedSuccess'), 'success');

    } catch (error: any) {
      console.error('Error saving profile:', error);
      if (error?.message === 'SESSION_EXPIRED') {
        notify(t('common.error'), t('profile.sessionExpired'));
        return;
      }
      const message =
        error?.response?.message ||
        SecurityUtils.handleSecureError(error, 'profile');
      notify(t('common.error'), message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    tap();
    confirmAction(
      t('profile.signOut'),
      t('profile.signOutConfirm'),
      () => signOut(),
      t('profile.signOut')
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
          <Text style={styles.loadingText}>{t('profile.loading')}</Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>{t('tab.profile')}</Text>
        <View style={styles.headerActions}>
          {!isGuest && profileComplete && !isEditing && (
            <TouchableOpacity
              style={styles.headerButton}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              onPress={() => setIsEditing(true)}
              accessibilityRole="button"
              accessibilityLabel={t('profile.editProfileA11y')}
            >
              <Edit3 size={20} color="#E8C87E" />
            </TouchableOpacity>
          )}
          {!isGuest && (
            <TouchableOpacity
              style={[styles.headerButton, styles.clearButton]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              onPress={handleSignOut}
              accessibilityRole="button"
              accessibilityLabel={t('profile.signOutA11y')}
            >
              <LogOut size={20} color="#FF6B6B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={kb > 0 ? { paddingBottom: kb + 24 } : { paddingBottom: insets.bottom + 88 }}
      >
        <View style={styles.content}>
          {isGuest ? (
            <View style={styles.guestContainer}>
              <View style={styles.avatarContainer}>
                <User size={48} color="#E8C87E" />
              </View>
              <Text style={styles.noProfileTitle}>{t('profile.guestTitle')}</Text>
              <Text style={styles.noProfileText}>
                {guestProfile
                  ? t('profile.guestSavedBody')
                  : t('profile.guestBody')}
              </Text>

              {guestProfile && (
                <View style={styles.guestDetails}>
                  <View style={styles.detailItem}>
                    <User size={20} color="#E8C87E" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>{t('profile.name')}</Text>
                      <Text style={styles.detailValue}>
                        {guestProfile.firstName} {guestProfile.lastName}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Calendar size={20} color="#E8C87E" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>{t('profile.dob')}</Text>
                      <Text style={styles.detailValue}>{guestProfile.dateOfBirth}</Text>
                    </View>
                  </View>
                  {!!guestProfile.timeOfBirth && (
                    <View style={styles.detailItem}>
                      <Clock size={20} color="#E8C87E" />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>{t('profile.tob')}</Text>
                        <Text style={styles.detailValue}>{guestProfile.timeOfBirth}</Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.detailItem}>
                    <MapPin size={20} color="#E8C87E" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>{t('profile.pob')}</Text>
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
                <Text style={styles.createProfileButtonText}>{t('common.signInUp')}</Text>
              </TouchableOpacity>

              {/* About */}
              <View style={styles.guestAboutCard}>
                <View style={styles.cardTitleRow}>
                  <Info size={18} color="#E8C87E" />
                  <Text style={styles.cardTitle}>{t('profile.about')}</Text>
                </View>
                <BrandLogo size={30} style={styles.aboutBrand} />
                <Text style={styles.aboutVersion}>{t('profile.version', { v: appVersion })}</Text>
                <Text style={styles.aboutDescription}>
                  {t('profile.aboutDescription')}
                </Text>
                <Text style={styles.aboutDisclaimer}>
                  {t('profile.aboutDisclaimer')}
                </Text>
              </View>
            </View>
          ) : !profileComplete && !isEditing ? (
            <View style={styles.noProfileContainer}>
              <User size={64} color="#E8C87E" />
              <Text style={styles.noProfileTitle}>{t('profile.noProfileTitle')}</Text>
              <Text style={styles.noProfileText}>
                {t('profile.noProfileText')}
              </Text>
              <TouchableOpacity
                style={styles.createProfileButton}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.createProfileButtonText}>{t('profile.createProfile')}</Text>
              </TouchableOpacity>
            </View>
          ) : isEditing ? (
            <View style={styles.editContainer}>
              <Text style={styles.sectionTitle}>
                {profileComplete ? t('profile.editProfile') : t('profile.createProfile')}
              </Text>

              <View
                style={styles.inputGroup}
                onLayout={(e) => { fieldY.current.firstName = e.nativeEvent.layout.y; }}
              >
                <Text style={styles.inputLabel}>{t('profile.firstNameLabel')}</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.firstName}
                  onChangeText={(text) => setEditForm({ ...editForm, firstName: text })}
                  placeholder={t('profile.firstNamePlaceholder')}
                  placeholderTextColor="#8B88A0"
                  maxLength={50}
                  onFocus={() => scrollToField('firstName')}
                />
              </View>

              <View
                style={styles.inputGroup}
                onLayout={(e) => { fieldY.current.lastName = e.nativeEvent.layout.y; }}
              >
                <Text style={styles.inputLabel}>{t('profile.lastNameLabel')}</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.lastName}
                  onChangeText={(text) => setEditForm({ ...editForm, lastName: text })}
                  placeholder={t('profile.lastNamePlaceholder')}
                  placeholderTextColor="#8B88A0"
                  maxLength={50}
                  onFocus={() => scrollToField('lastName')}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('profile.dobLabel')}</Text>
                <DateField
                  value={editForm.dateOfBirth}
                  onChangeText={(text) => setEditForm({ ...editForm, dateOfBirth: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('profile.tobLabel')}</Text>
                <TimeField
                  value={editForm.timeOfBirth ?? ''}
                  onChangeText={(text) => setEditForm({ ...editForm, timeOfBirth: text })}
                />
              </View>

              <View
                style={styles.inputGroup}
                onLayout={(e) => { fieldY.current.place = e.nativeEvent.layout.y; }}
              >
                <Text style={styles.inputLabel}>{t('profile.pobLabel')}</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.placeOfBirth}
                  onChangeText={handlePlaceSearch}
                  placeholder={t('profile.pobPlaceholder')}
                  placeholderTextColor="#8B88A0"
                  maxLength={200}
                  onFocus={() => scrollToField('place')}
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
                <Text style={styles.inputLabel}>{t('profile.genderLabel')}</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      editForm.gender === 'male' && styles.genderButtonActive
                    ]}
                    onPress={() => setEditForm({ ...editForm, gender: 'male' })}
                    accessibilityRole="button"
                    accessibilityLabel={t('profile.selectMaleA11y')}
                    accessibilityState={{ selected: editForm.gender === 'male' }}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      editForm.gender === 'male' && styles.genderButtonTextActive
                    ]}>{t('profile.male')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      editForm.gender === 'female' && styles.genderButtonActive
                    ]}
                    onPress={() => setEditForm({ ...editForm, gender: 'female' })}
                    accessibilityRole="button"
                    accessibilityLabel={t('profile.selectFemaleA11y')}
                    accessibilityState={{ selected: editForm.gender === 'female' }}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      editForm.gender === 'female' && styles.genderButtonTextActive
                    ]}>{t('profile.female')}</Text>
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
                      <Text style={styles.saveButtonText}>{t('profile.saveProfile')}</Text>
                    </>
                  )}
                </TouchableOpacity>

                {profileComplete && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelEdit}
                  >
                    <X size={20} color="#C7C4D6" />
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : userProfile ? (
            <View style={styles.profileContainer}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  {initials ? (
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  ) : (
                    <User size={40} color="#E8C87E" />
                  )}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {userProfile.firstName} {userProfile.lastName}
                  </Text>
                  {signSummary ? (
                    <Text style={styles.profileSubtitle}>{signSummary}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.profileDetails}>
                <View style={styles.detailItem}>
                  <Calendar size={20} color="#E8C87E" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>{t('profile.dob')}</Text>
                    <Text style={styles.detailValue}>{userProfile.dateOfBirth}</Text>
                  </View>
                </View>

                {userProfile.timeOfBirth && (
                  <View style={styles.detailItem}>
                    <Clock size={20} color="#E8C87E" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>{t('profile.tob')}</Text>
                      <Text style={styles.detailValue}>{userProfile.timeOfBirth}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.detailItem}>
                  <MapPin size={20} color="#E8C87E" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>{t('profile.pob')}</Text>
                    <Text style={styles.detailValue}>{userProfile.placeOfBirth}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <Users size={20} color="#E8C87E" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>{t('profile.gender')}</Text>
                    <Text style={styles.detailValue}>
                      {userProfile.gender === 'male' ? t('profile.male') : t('profile.female')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Settings */}
              <View style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Settings size={18} color="#E8C87E" />
                  <Text style={styles.cardTitle}>{t('profile.settings')}</Text>
                </View>

                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={handleChangePassword}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingIcon}>
                    <KeyRound size={18} color="#E8C87E" />
                  </View>
                  <Text style={styles.settingLabel}>{t('profile.changePassword')}</Text>
                </TouchableOpacity>

                <View style={styles.settingRow}>
                  <View style={styles.settingIcon}>
                    <Bell size={18} color="#E8C87E" />
                  </View>
                  <Text style={styles.settingLabel}>{t('profile.reminders')}</Text>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={toggleNotifications}
                    trackColor={{ false: 'rgba(255,255,255,0.10)', true: '#E8C87E' }}
                    thumbColor="#F4F1E8"
                  />
                </View>

                {LOCALIZATION_ENABLED && availableLangs.length > 1 && (
                  <TouchableOpacity
                    style={styles.settingRow}
                    onPress={() => { tap(); setLangModal(true); }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t('profile.language')}
                  >
                    <View style={styles.settingIcon}>
                      <Globe size={18} color="#E8C87E" />
                    </View>
                    <Text style={styles.settingLabel}>{t('profile.language')}</Text>
                    <Text style={styles.langCurrent}>
                      {availableLangs.find((l) => l.code === lang)?.native ?? 'English'}
                    </Text>
                    <ChevronRight size={18} color="#8B88A0" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => { tap(); shareApp(); }}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingIcon}>
                    <Share2 size={18} color="#E8C87E" />
                  </View>
                  <Text style={styles.settingLabel}>{t('profile.shareApp')}</Text>
                  <ChevronRight size={18} color="#5A5768" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => { tap(); rateApp(); }}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingIcon}>
                    <Star size={18} color="#E8C87E" />
                  </View>
                  <Text style={styles.settingLabel}>{t('profile.rateApp')}</Text>
                  <ChevronRight size={18} color="#5A5768" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={handleSignOut}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingIcon}>
                    <LogOut size={18} color="#C7C4D6" />
                  </View>
                  <Text style={styles.settingLabel}>{t('profile.signOut')}</Text>
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
                    {t('profile.deleteAccount')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Astropanth Plus */}
              <TouchableOpacity
                style={styles.plusCard}
                onPress={() => {
                  tap();
                  router.push('/premium');
                }}
                activeOpacity={0.85}
              >
                <View style={styles.plusIcon}>
                  <Sparkles size={20} color="#E8C87E" />
                </View>
                <View style={styles.plusTextWrap}>
                  <Text style={styles.plusTitle}>{t('profile.plusTitle')}</Text>
                  {isPremium ? (
                    <Text style={styles.plusBadgeText}>{t('profile.plusMember')}</Text>
                  ) : (
                    <Text style={styles.plusSubtitle}>
                      {t('profile.plusSubtitle')}
                    </Text>
                  )}
                </View>
                <ChevronRight size={18} color="#8B88A0" />
              </TouchableOpacity>

              {/* About */}
              <View style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Info size={18} color="#E8C87E" />
                  <Text style={styles.cardTitle}>{t('profile.about')}</Text>
                </View>
                <BrandLogo size={30} style={styles.aboutBrand} />
                <Text style={styles.aboutVersion}>{t('profile.version', { v: appVersion })}</Text>
                <Text style={styles.aboutDescription}>
                  {t('profile.aboutDescription')}
                </Text>
                <Text style={styles.aboutDisclaimer}>
                  {t('profile.aboutDisclaimer')}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={langModal}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModal(false)}
      >
        <Pressable style={styles.langBackdrop} onPress={() => setLangModal(false)}>
          <Pressable style={styles.langSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.langSheetTitle}>{t('profile.language')}</Text>
            {availableLangs.map((l) => {
              const active = lang === l.code;
              return (
                <TouchableOpacity
                  key={l.code}
                  style={styles.langOption}
                  onPress={() => { tap(); setLang(l.code); setLangModal(false); }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <View>
                    <Text style={[styles.langOptionNative, active && styles.langOptionActive]}>{l.native}</Text>
                    <Text style={styles.langOptionLabel}>{l.label}</Text>
                  </View>
                  {active ? <Check size={20} color="#E8C87E" /> : null}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
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
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 20,
  },
  createProfileButton: {
    backgroundColor: '#E8C87E',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  createProfileButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#0B0B1A',
  },
  editContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 17,
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
    fontSize: 15,
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
    fontSize: 14,
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
  avatarInitials: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#E8C87E',
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
    color: '#8B88A0',
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
    fontSize: 17,
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
  langCurrent: { fontSize: 15, fontFamily: 'Inter-Medium', color: '#F4F1E8', marginRight: 4 },
  langBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  langSheet: {
    backgroundColor: '#141024',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 18,
    paddingBottom: 34,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(232,200,126,0.20)',
  },
  langSheetTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#E8C87E',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  langOptionNative: { fontSize: 17, fontFamily: 'Inter-Medium', color: '#F4F1E8' },
  langOptionActive: { color: '#E8C87E', fontFamily: 'Inter-SemiBold' },
  langOptionLabel: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#8B88A0', marginTop: 2 },
  settingLabelDanger: {
    color: '#FF6B6B',
  },
  plusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(232, 200, 126, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    borderRadius: 16,
    padding: 16,
  },
  plusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(232, 200, 126, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.30)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusTextWrap: {
    flex: 1,
  },
  plusTitle: {
    fontSize: 17,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    marginBottom: 2,
  },
  plusSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
  },
  plusBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#E8C87E',
  },
  aboutBrand: { marginTop: 2, marginBottom: 2 },
  aboutVersion: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#E8C87E',
    marginTop: 2,
  },
  aboutDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    marginTop: 6,
    lineHeight: 21,
  },
  aboutDisclaimer: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8B88A0',
    marginTop: 6,
  },
});