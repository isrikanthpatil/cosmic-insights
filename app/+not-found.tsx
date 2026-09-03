import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradientColors, colors, fonts } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFoundScreen() {
  const { t } = useLanguage();
  return (
    <>
      <Stack.Screen options={{ title: t('notfound.oops') }} />
      <LinearGradient
        colors={gradientColors}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{t('notfound.title')}</Text>
          <Text style={styles.message}>{t('notfound.message')}</Text>
          <Link href="/" style={styles.link}>
            <Text style={styles.linkText}>{t('notfound.link')}</Text>
          </Link>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.display,
    color: colors.text,
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: 28,
    textAlign: 'center',
  },
  link: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: colors.gold,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.bgStart,
  },
});
