import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { tap } from '@/utils/haptics';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoginNudgeProps {
  /** Override the default nudge copy. */
  message?: string;
}

/**
 * A slim, tasteful banner shown to guests inviting them to sign in. Tapping
 * "Sign in" opens the modal login route. This is a nudge, not a wall — the
 * surrounding content remains fully usable.
 */
export default function LoginNudge({ message }: LoginNudgeProps) {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <View style={styles.banner}>
      <Sparkles size={16} color="#E8C87E" />
      <Text style={styles.text} numberOfLines={2}>
        {message ?? t('nudge.signInSave')}
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          tap();
          router.push('/login');
        }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Sign in"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.buttonText}>{t('common.signIn')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(232, 200, 126, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#C7C4D6',
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#E8C87E',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#0B0B1A',
  },
});
