import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import { useChart } from '@/contexts/ChartContext';
import { Profile } from '@/contexts/AuthContext';
import { tap } from '@/utils/haptics';
import { showToast } from '@/utils/toast';
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
  const [modalVisible, setModalVisible] = useState(false);

  const handleSubmit = (profile: Profile) => {
    setGuestProfile(profile);
    setModalVisible(false);
    showToast('Birth details saved on this device.', 'success');
  };

  return (
    <>
      <View style={styles.card}>
        <Star size={48} color="#E8C87E" />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{message}</Text>
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
          <KeyboardAvoidingView
            style={styles.modalCard}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
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
              <Text style={styles.modalCaption}>
                For a free reading. Saved on this device only.
              </Text>
              <BirthDetailsForm onSubmit={handleSubmit} submitLabel="Get my reading" />
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
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
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    textAlign: 'center',
  },
  text: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#E8C87E',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginTop: 4,
  },
  buttonText: {
    fontSize: 16,
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
    fontSize: 22,
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
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#7E7B92',
    lineHeight: 18,
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
