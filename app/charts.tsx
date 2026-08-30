import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2, User, X, ChevronRight } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import BirthDetailsForm from '@/components/BirthDetailsForm';
import { useChart } from '@/contexts/ChartContext';
import { useAuth, Profile } from '@/contexts/AuthContext';
import { tap } from '@/utils/haptics';
import { showToast } from '@/utils/toast';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

export default function ChartsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const kb = useKeyboardHeight();
  const { savedCharts, saveChart, deleteChart, setExplore, clearExplore, guestProfile } = useChart();
  const { profile: authProfile } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);

  const ownProfile: Profile | null =
    authProfile && authProfile.dateOfBirth ? authProfile : guestProfile;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/more');
  };

  const viewOwn = () => {
    tap();
    clearExplore();
    router.push('/(tabs)/astrology');
  };

  const viewChart = (p: Profile) => {
    tap();
    setExplore(p);
    router.push('/(tabs)/astrology');
  };

  const handleAdd = (profile: Profile) => {
    saveChart(profile);
    setModalVisible(false);
    showToast(`${profile.firstName || 'Chart'} saved.`, 'success');
  };

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Back">
          <ArrowLeft size={24} color="#E8C87E" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Saved Charts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Save charts for family and friends, then switch between them to read any one.
        </Text>

        <TouchableOpacity style={styles.addButton} onPress={() => { tap(); setModalVisible(true); }} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Add a chart">
          <Plus size={18} color="#0B0B1A" />
          <Text style={styles.addButtonText}>Add a chart</Text>
        </TouchableOpacity>

        {ownProfile && (
          <>
            <Text style={styles.sectionLabel}>YOUR CHART</Text>
            <TouchableOpacity style={styles.card} onPress={viewOwn} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="View your chart">
              <View style={styles.avatar}><User size={18} color="#E8C87E" /></View>
              <View style={styles.cardText}>
                <Text style={styles.name}>{`${ownProfile.firstName} ${ownProfile.lastName}`.trim() || 'You'}</Text>
                <Text style={styles.meta}>{ownProfile.dateOfBirth}{ownProfile.placeOfBirth ? ` · ${ownProfile.placeOfBirth}` : ''}</Text>
              </View>
              <ChevronRight size={20} color="#8B88A0" />
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.sectionLabel}>SAVED</Text>
        {savedCharts.length === 0 ? (
          <Text style={styles.empty}>No saved charts yet. Add one above, or save a chart from the "Explore another chart" bar on the reading screens.</Text>
        ) : (
          savedCharts.map((c) => (
            <View key={c.id} style={styles.card}>
              <TouchableOpacity style={styles.cardTap} onPress={() => viewChart(c.profile)} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`View ${c.profile.firstName}'s chart`}>
                <View style={styles.avatar}><User size={18} color="#E8C87E" /></View>
                <View style={styles.cardText}>
                  <Text style={styles.name}>{`${c.profile.firstName} ${c.profile.lastName}`.trim()}</Text>
                  <Text style={styles.meta}>{c.profile.dateOfBirth}{c.profile.placeOfBirth ? ` · ${c.profile.placeOfBirth}` : ''}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { tap(); deleteChart(c.id); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel={`Delete ${c.profile.firstName}'s chart`}>
                <Trash2 size={18} color="#8B88A0" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, kb > 0 && { marginBottom: kb }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add a chart</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} accessibilityLabel="Close">
                <X size={24} color="#C7C4D6" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalCaption}>Saved on this device.</Text>
              <BirthDetailsForm onSubmit={handleAdd} submitLabel="Save chart" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  topTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  intro: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#C7C4D6', lineHeight: 20, marginBottom: 16 },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#E8C87E', borderRadius: 24, paddingVertical: 14, marginBottom: 8,
  },
  addButtonText: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: '#0B0B1A' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter-SemiBold', color: '#8B88A0', letterSpacing: 2, marginTop: 16, marginBottom: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(232,200,126,0.25)',
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  cardTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(232,200,126,0.08)', borderWidth: 1, borderColor: 'rgba(232,200,126,0.25)',
  },
  cardText: { flex: 1 },
  name: { fontSize: 16, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  meta: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#8B88A0', marginTop: 2 },
  empty: { fontSize: 13, fontFamily: 'Inter-Regular', color: '#8B88A0', lineHeight: 19 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#140F2A', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%',
    borderWidth: 1, borderColor: 'rgba(232,200,126,0.25)',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12 },
  modalTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  modalCaption: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#8B88A0' },
});
