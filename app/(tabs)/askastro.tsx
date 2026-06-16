import React from 'react';
import { StyleSheet } from 'react-native';
import AstrologyAI from '@/components/AstrologyAI';
import { useChart } from '@/contexts/ChartContext';
import ScreenBackground from '@/components/ScreenBackground';

export default function AskAstro() {
  // Use the active profile (authenticated or guest-saved) so guests get
  // personalized answers when they have entered birth details, and general
  // answers otherwise.
  const { activeProfile } = useChart();
  return (
    <ScreenBackground style={styles.container}>
      <AstrologyAI userProfile={activeProfile ?? undefined} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
