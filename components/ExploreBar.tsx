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
import { UserPlus, X } from 'lucide-react-native';
import { useChart } from '@/contexts/ChartContext';
import { Profile } from '@/contexts/AuthContext';
import { tap } from '@/utils/haptics';
import BirthDetailsForm from '@/components/BirthDetailsForm';

export default function ExploreBar() {
  const { isExploring, exploreSubject, setExplore, clearExplore } = useChart();

  const [modalVisible, setModalVisible] = useState(false);

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleSubmit = (profile: Profile) => {
    setExplore(profile);
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
            <X size={16} color="#0B0B1A" />
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
          <UserPlus size={18} color="#E8C87E" />
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
                <X size={24} color="#C7C4D6" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {modalVisible && (
                <BirthDetailsForm onSubmit={handleSubmit} submitLabel="View chart" />
              )}

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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  exploreButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#E8C87E',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: 'rgba(232, 200, 126, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.30)',
    borderLeftWidth: 4,
    borderLeftColor: '#E8C87E',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerEyebrow: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#E8C87E',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#F4F1E8',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8C87E',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 12,
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
