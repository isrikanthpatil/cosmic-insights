import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/constants/theme';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  iconColor?: string;
}

/**
 * Reusable section title: an icon followed by a title in the shared
 * section-title style. Mirrors the inline `sectionHeader` pattern used on the
 * Astrology / Numerology screens so headings stay consistent.
 */
export default function SectionHeader({ icon: Icon, title, iconColor = colors.gold }: SectionHeaderProps) {
  return (
    <View style={styles.header}>
      <Icon size={20} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm8,
    marginBottom: spacing.md16,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
});
