import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AstrologyAI from '@/components/AstrologyAI';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { profile } = useAuth();
  return (
    <LinearGradient
      colors={['#0F0C29', '#24243e', '#302B63']}
      style={styles.container}
    >
      <AstrologyAI userProfile={profile ?? undefined} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
