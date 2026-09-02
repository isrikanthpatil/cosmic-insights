import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { House, Sparkles, Grid3x3, MessageCircle, LayoutGrid, User } from 'lucide-react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import AdBanner from '@/components/AdBanner';
import { useLanguage } from '@/contexts/LanguageContext';

// Custom tab label: single line at a UNIFORM fixed size for every tab, so long
// labels like "Numerology" render the same size as the others (no per-label
// auto-shrink, which previously made "Numerology" look smaller). allowFontScaling
// is off so OS font-size settings can't shrink one label relative to the rest.
function tabLabel(title: string) {
  return ({ color }: { focused: boolean; color: string }) => (
    <Text
      numberOfLines={1}
      allowFontScaling={false}
      style={{
        color,
        fontSize: 9,
        fontFamily: 'Inter-Medium',
        letterSpacing: -0.4,
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
  const { t } = useLanguage();
  return (
    <Tabs
      // Render one gentle banner directly above the tab bar on every tab screen
      // (hidden for Astropanth Plus / on web via the AdBanner component itself).
      tabBar={(props) => (
        <>
          <AdBanner />
          <BottomTabBar {...props} />
        </>
      )}
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
          paddingHorizontal: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab.home'),
          tabBarLabel: tabLabel(t('tab.home')),
          tabBarIcon: ({ size, color }) => (
            <House size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="astrology"
        options={{
          title: t('tab.astrology'),
          tabBarLabel: tabLabel(t('tab.astrology')),
          tabBarIcon: ({ size, color }) => (
            <Sparkles size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="numerology"
        options={{
          title: t('tab.numerology'),
          tabBarLabel: tabLabel(t('tab.numerology')),
          tabBarIcon: ({ size, color }) => (
            <Grid3x3 size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="askastro"
        options={{
          title: t('tab.askastro'),
          tabBarLabel: tabLabel(t('tab.askastro')),
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('tab.more'),
          tabBarLabel: tabLabel(t('tab.more')),
          tabBarIcon: ({ size, color }) => (
            <LayoutGrid size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tab.profile'),
          tabBarLabel: tabLabel(t('tab.profile')),
          tabBarIcon: ({ size, color }) => (
            <User size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
