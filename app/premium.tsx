import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import BrandLogo from '@/components/BrandLogo';
import { tap } from '@/utils/haptics';
import { showToast } from '@/utils/toast';
import { usePremium } from '@/contexts/PremiumContext';
import { useAuth } from '@/contexts/AuthContext';
import { redeemCode } from '@/utils/promo';
import { startCheckout } from '@/utils/razorpay';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  plusFeatures,
  plusPlanName,
  plusTagline,
  BILLING_ENABLED,
  LAUNCH_PRICING,
  PRODUCTS,
} from '@/constants/plans';

export default function PremiumScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPremium, grant } = usePremium();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [buying, setBuying] = useState(false);

  const handleBuy = async (item: string) => {
    if (buying) return;
    tap();
    setBuying(true);
    const res = await startCheckout(item, { userId: user?.id, email: (user as any)?.email });
    setBuying(false);
    if (res.ok) {
      await grant(res.plan, res.untilMs);
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'info');
    }
  };

  // Plus isn't live yet — capture interest instead of a dead Subscribe button.
  const handleNotify = () => {
    tap();
    showToast(t('premium.notifyToast'), 'success');
  };

  const handleRedeem = async () => {
    if (redeeming) return;
    tap();
    setRedeeming(true);
    const res = await redeemCode(code, user?.id);
    setRedeeming(false);
    if (res.ok) {
      await grant(res.plan === 'plus' ? 'plus' : 'reports', res.untilMs);
      setCode('');
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'info');
    }
  };

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            tap();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/profile');
            }
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel={t('common.goBack')}
        >
          <ArrowLeft size={22} color="#E8C87E" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{t('premium.planTitle')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <BrandLogo size={46} showWordmark={false} style={styles.heroMark} />
          <Text style={styles.heroTitle}>{plusTagline}</Text>
          <Text style={styles.heroSubtitle}>
            {t('premium.heroSubtitle', { plan: plusPlanName })}
          </Text>
        </View>

        {isPremium ? (
          // Already entitled — show the member state instead of a CTA.
          <View style={styles.memberCard}>
            <Text style={styles.memberTitle}>{t('premium.memberTitle')}</Text>
            <Text style={styles.memberText}>
              {t('premium.memberText')}
            </Text>
          </View>
        ) : null}

        {/* Plus benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>{t('premium.included')}</Text>
          {plusFeatures.map((feature) => (
            <View key={feature.label} style={styles.benefitRow}>
              <View style={styles.checkIcon}>
                <Check size={14} color="#E8C87E" />
              </View>
              <Text style={styles.benefitText}>{feature.label}</Text>
            </View>
          ))}
        </View>

        {/* Plus not yet live: invite interest rather than showing placeholder
            pricing or a dead Subscribe button. */}
        {!isPremium && (
          <>
            {/* Buy buttons only on WEB. On Android (and when billing is off) we
                never show or link to a web purchase — Play policy forbids
                steering to out-of-app payment for digital goods; Play Billing is
                a separate future task. Android sees the coming-soon state. */}
            {BILLING_ENABLED && Platform.OS === 'web' ? (
              <>
                <TouchableOpacity
                  style={[styles.primaryButton, buying && styles.primaryButtonDisabled]}
                  onPress={() => handleBuy(LAUNCH_PRICING ? PRODUCTS.plus_launch.id : PRODUCTS.plus_yearly.id)}
                  disabled={buying}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('premium.buyYearlyLabel')}
                >
                  <Text style={styles.primaryButtonText}>
                    {buying
                      ? t('premium.opening')
                      : t('premium.getPlus', { price: LAUNCH_PRICING ? PRODUCTS.plus_launch.price : PRODUCTS.plus_yearly.price })}
                  </Text>
                </TouchableOpacity>
                {LAUNCH_PRICING ? (
                  <Text style={styles.launchNote}>{t('premium.launchNote')}</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleBuy(PRODUCTS.plus_monthly.id)}
                    disabled={buying}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={t('premium.buyMonthlyLabel')}
                  >
                    <Text style={styles.secondaryButtonText}>{t('premium.orPrice', { price: PRODUCTS.plus_monthly.price })}</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <Text style={styles.comingSoonHeadline}>{t('premium.comingSoon')}</Text>
                <Text style={styles.placeholderNote}>{t('premium.comingSoonNote')}</Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleNotify}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('premium.notifyLabel')}
                >
                  <Text style={styles.primaryButtonText}>{t('premium.notify')}</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Promo code — unlock Plus with a code (for early testers/friends). */}
            <View style={styles.codeCard}>
              <Text style={styles.codeTitle}>{t('premium.haveCode')}</Text>
              <View style={styles.codeRow}>
                <TextInput
                  style={styles.codeInput}
                  value={code}
                  onChangeText={setCode}
                  placeholder={t('premium.enterCode')}
                  placeholderTextColor="#6E6B84"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!redeeming}
                  returnKeyType="done"
                  onSubmitEditing={handleRedeem}
                />
                <TouchableOpacity
                  style={[styles.codeButton, (!code.trim() || redeeming) && styles.codeButtonDisabled]}
                  onPress={handleRedeem}
                  disabled={!code.trim() || redeeming}
                  accessibilityRole="button"
                  accessibilityLabel={t('premium.redeemLabel')}
                >
                  <Text style={styles.codeButtonText}>{redeeming ? '…' : t('premium.redeem')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerText}>{t('premium.disclaimer')}</Text>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  heroMark: { marginBottom: 4 },
  hero: {
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 24,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(232, 200, 126, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 12,
  },
  memberCard: {
    backgroundColor: 'rgba(232, 200, 126, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    borderRadius: 16,
    padding: 20,
    gap: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  memberTitle: {
    fontSize: 17,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#E8C87E',
    textAlign: 'center',
  },
  memberText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    textAlign: 'center',
    lineHeight: 21,
  },
  benefitsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  benefitsTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#E8C87E',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(232, 200, 126, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.30)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#F4F1E8',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  priceCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 16,
    padding: 16,
    gap: 4,
    alignItems: 'center',
  },
  priceCardHighlight: {
    borderColor: 'rgba(232, 200, 126, 0.45)',
  },
  priceAmount: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  pricePeriod: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
  },
  priceNote: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#E8C87E',
    textAlign: 'center',
    marginTop: 2,
  },
  comingSoonHeadline: {
    fontSize: 17,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
    textAlign: 'center',
    marginTop: 8,
  },
  placeholderNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8B88A0',
    textAlign: 'center',
    marginTop: 8,
  },
  launchNote: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#E8C87E',
    textAlign: 'center',
    marginTop: 10,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8C87E',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(232, 200, 126, 0.30)',
  },
  primaryButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#0B0B1A',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#E8C87E',
  },
  codeCard: {
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(232,200,126,0.20)',
    borderRadius: 16,
    padding: 16,
  },
  codeTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#C7C4D6',
    marginBottom: 10,
  },
  codeRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  codeInput: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(232,200,126,0.25)',
    color: '#F4F1E8',
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    letterSpacing: 1,
  },
  codeButton: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#E8C87E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeButtonDisabled: { opacity: 0.5 },
  codeButtonText: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: '#161225' },
  comingSoonNote: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#E8C87E',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 1,
  },
  restoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  restoreText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#C7C4D6',
  },
  disclaimerCard: {
    backgroundColor: 'rgba(232, 200, 126, 0.06)',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderLeftWidth: 2,
    borderLeftColor: '#E8C87E',
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
    lineHeight: 17,
    fontStyle: 'italic',
  },
});
