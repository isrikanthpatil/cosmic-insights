import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import { useChart } from '@/contexts/ChartContext';
import { Profile, useAuth } from '@/contexts/AuthContext';
import { tap } from '@/utils/haptics';
import { showToast } from '@/utils/toast';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import BirthDetailsForm from '@/components/BirthDetailsForm';

interface GuestEntryPromptProps {
  /** Heading for the friendly empty-state card. */
  title?: string;
  /** Supporting copy below the heading. */
  message?: string;
}

/**
 * Guest empty-state shown when there is no activeProfile yet. Instead of a
 * "Profile Required" wall, it invites the guest to enter birth details for a
 * free reading. Submitting saves a local guest profile (persisted), so the
 * reading renders immediately and survives restarts.
 */
export default function GuestEntryPrompt({
  title = 'Get your free reading',
  message = 'Enter your birth details to unlock your personalized astrology and numerology — no account needed.',
}: GuestEntryPromptProps) {
  const { setGuestProfile } = useChart();
  const { user, updateProfile } = useAuth();
  const authed = !!user;
  const [modalVisible, setModalVisible] = useState(false);
  const kb = useKeyboardHeight();

  // When signed in (e.g. a fresh Google account with no birth details) save to
  // the account so it syncs and persists; guests save locally on the device.
  const handleSubmit = async (profile: Profile) => {
    if (authed) {
      try {
        await updateProfile(profile);
        setModalVisible(false);
        showToast('Birth details saved to your account.', 'success');
      } catch {
        showToast('Could not save. Please try again.', 'error');
      }
    } else {
      setGuestProfile(profile);
      setModalVisible(false);
      showToast('Birth details saved on this device.', 'success');
    }
  };

  // A signed-in user is completing their own profile, so drop the guest-only
  // "no account needed" framing in favour of account-appropriate copy.
  const effectiveTitle = authed ? 'Complete your birth details' : title;
  const effectiveMessage = authed
    ? 'Add your birth details to unlock your personalized astrology and numerology.'
    : message;
  const modalCaption = authed
    ? 'Saved to your account.'
    : 'For a free reading. Saved on this device only.';

  return (
    <>
      <View style={styles.card}>
        <Star size={48} color="#E8C87E" />
        <Text style={styles.title}>{effectiveTitle}</Text>
        <Text style={styles.text}>{effectiveMessage}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            tap();
            setModalVisible(true);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Enter birth details</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, kb > 0 && { marginBottom: kb }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your birth details</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                accessibilityLabel="Close"
              >
                <X size={24} color="#C7C4D6" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalCaption}>{modalCaption}</Text>
              <BirthDetailsForm onSubmit={handleSubmit} submitLabel="Get my reading" />
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    textAlign: 'center',
  },
  text: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    textAlign: 'center',
    lineHeight: 21,
  },
  button: {
    backgroundColor: '#E8C87E',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginTop: 4,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#0B0B1A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#140F2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
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
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  modalCaption: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7E7B92',
    lineHeight: 17,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#C7C4D6',
  },
});
