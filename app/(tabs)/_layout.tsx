import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { House, Sparkles, Grid3x3, MessageCircle, LayoutGrid, User } from 'lucide-react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

// Custom tab label: single line at a UNIFORM fixed size for every tab, so long
// labels like "Numerology" render the same size as the others (no per-label
// auto-shrink, which previously made "Numerology" look smaller). allowFontScaling
// is off so OS font-size settings can't shrink one label relative to the rest.
function tabLabel(title: string) {
  return ({ color }: { focused: boolean; color: string }) => (
    <Text
      numberOfLines={1}
      allowFontScaling={false}
      adjustsFontSizeToFit
      minimumFontScale={0.9}
      style={{
        color,
        fontSize: 9.5,
        fontFamily: 'Inter-Medium',
        letterSpacing: -0.3,
        textAlign: 'center',
        width: '100%',
      }}
    >
      {title}
    </Text>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#13102A',
          borderTopColor: 'rgba(232, 200, 126, 0.22)',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarItemStyle: {
          paddingHorizontal: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: tabLabel('Home'),
          tabBarIcon: ({ size, color }) => (
            <House size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="astrology"
        options={{
          title: 'Astrology',
          tabBarLabel: tabLabel('Astrology'),
          tabBarIcon: ({ size, color }) => (
            <Sparkles size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="numerology"
        options={{
          title: 'Numerology',
          tabBarLabel: tabLabel('Numerology'),
          tabBarIcon: ({ size, color }) => (
            <Grid3x3 size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="askastro"
        options={{
          title: 'AskAstro',
          tabBarLabel: tabLabel('AskAstro'),
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarLabel: tabLabel('More'),
          tabBarIcon: ({ size, color }) => (
            <LayoutGrid size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: tabLabel('Profile'),
          tabBarIcon: ({ size, color }) => (
            <User size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
