import React from 'react';
import AstrologyAI from '@/components/AstrologyAI';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { profile } = useAuth();
  return <AstrologyAI userProfile={profile ?? undefined} />;
}
