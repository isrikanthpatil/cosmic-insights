import { Tabs } from 'expo-router';
import { House, Sparkles, Grid3x3, MessageCircle, User } from 'lucide-react-native';
import React from 'react';
import { colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#13102A',
          borderTopColor: 'rgba(232, 200, 126, 0.22)',
          borderTopWidth: 1,
          height: 82,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter-Medium',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <House size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="astrology"
        options={{
          title: 'Astrology',
          tabBarIcon: ({ size, color }) => (
            <Sparkles size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="numerology"
        options={{
          title: 'Numbers',
          tabBarIcon: ({ size, color }) => (
            <Grid3x3 size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="askastro"
        options={{
          title: 'AskAstro',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
