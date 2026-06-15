import React from 'react';
import { StyleSheet } from 'react-native';
import AstrologyAI from '@/components/AstrologyAI';
import { useAuth } from '@/contexts/AuthContext';
import ScreenBackground from '@/components/ScreenBackground';

export default function AskAstro() {
  const { profile } = useAuth();
  return (
    <ScreenBackground style={styles.container}>
      <AstrologyAI userProfile={profile ?? undefined} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
