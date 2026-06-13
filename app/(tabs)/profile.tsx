import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, CreditCard as Edit3, Save, X, Calendar, Clock, MapPin, Users, LogOut } from 'lucide-react-native';
import { searchPlaces } from '@/data/indianPlaces';
import { SecurityUtils } from '@/utils/security';
import { notify, confirmAction } from '@/utils/notify';
import { useAuth, Profile as UserProfile } from '@/contexts/AuthContext';

export default function Profile() {
  const { profile, isLoading: loading, updateProfile, signOut } = useAuth();
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

  useEffect(() => {
    // Populate the edit form from the authenticated profile. If the profile
    // is missing required fields, start in editing mode so the user can
    // complete it.
    if (profile) {
      setEditForm(profile);
    }
    if (!loading && !profileComplete) {
      setIsEditing(true);
    }
  }, [profile, loading, profileComplete]);

  const saveProfile = async () => {
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
        notify('Error', 'Please enter time in HH:MM AM/PM format');
        return;
      }

      // Save to PocketBase via the auth context
      await updateProfile(sanitizedProfile);

      setIsEditing(false);
      notify('Success', 'Profile saved successfully!');

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

  const handlePlaceSearch = (text: string) => {
    setEditForm({ ...editForm, placeOfBirth: text });
    
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
    setEditForm({ ...editForm, placeOfBirth: place });
    setShowPlaceSuggestions(false);
    setPlaceSuggestions([]);
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#0F0C29', '#24243e', '#302B63']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0F0C29', '#24243e', '#302B63']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.headerActions}>
          {profileComplete && !isEditing && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setIsEditing(true)}
            >
              <Edit3 size={20} color="#FFD700" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.headerButton, styles.clearButton]}
            onPress={handleSignOut}
          >
            <LogOut size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {!profileComplete && !isEditing ? (
            <View style={styles.noProfileContainer}>
              <User size={64} color="#FFD700" />
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
                  placeholderTextColor="#666"
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
                  placeholderTextColor="#666"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date of Birth * (DD/MM/YYYY)</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.dateOfBirth}
                  onChangeText={(text) => setEditForm({ ...editForm, dateOfBirth: text })}
                  placeholder="15/06/1990"
                  placeholderTextColor="#666"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Time of Birth (HH:MM AM/PM)</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.timeOfBirth}
                  onChangeText={(text) => setEditForm({ ...editForm, timeOfBirth: text })}
                  placeholder="10:30 AM"
                  placeholderTextColor="#666"
                  maxLength={20}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Place of Birth *</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.placeOfBirth}
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
                      <Save size={20} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Save Profile</Text>
                    </>
                  )}
                </TouchableOpacity>

                {profileComplete && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelEdit}
                  >
                    <X size={20} color="#B8B8B8" />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : userProfile ? (
            <View style={styles.profileContainer}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <User size={48} color="#FFD700" />
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
                  <Calendar size={20} color="#4CAF50" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Date of Birth</Text>
                    <Text style={styles.detailValue}>{userProfile.dateOfBirth}</Text>
                  </View>
                </View>

                {userProfile.timeOfBirth && (
                  <View style={styles.detailItem}>
                    <Clock size={20} color="#2196F3" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Time of Birth</Text>
                      <Text style={styles.detailValue}>{userProfile.timeOfBirth}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.detailItem}>
                  <MapPin size={20} color="#FF9800" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Place of Birth</Text>
                    <Text style={styles.detailValue}>{userProfile.placeOfBirth}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <Users size={20} color="#9C27B0" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Gender</Text>
                    <Text style={styles.detailValue}>
                      {userProfile.gender === 'male' ? 'Male' : 'Female'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </LinearGradient>
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
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  noProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 20,
  },
  noProfileTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
  },
  noProfileText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  createProfileButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  createProfileButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  editContainer: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
    marginBottom: 10,
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
  buttonContainer: {
    gap: 12,
    marginTop: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#B8B8B8',
  },
  profileContainer: {
    gap: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
  },
  profileDetails: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#B8B8B8',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
});