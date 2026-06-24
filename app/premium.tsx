import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Sparkles } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import { tap } from '@/utils/haptics';
import { showToast } from '@/utils/toast';
import { usePremium } from '@/contexts/PremiumContext';
import {
  plusFeatures,
  plusPrices,
  plusPlanName,
  plusTagline,
} from '@/constants/plans';

export default function PremiumScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();

  // Restore purchases is a no-op for now — there's no billing provider yet.
  const handleRestore = () => {
    tap();
    showToast('Restore will be available once subscriptions launch.', 'info');
  };

  return (
    <ScreenBackground style={styles.container}>
      <View style={styles.topBar}>
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
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color="#E8C87E" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Astropanth Plus</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Sparkles size={28} color="#E8C87E" />
          </View>
          <Text style={styles.heroTitle}>{plusTagline}</Text>
          <Text style={styles.heroSubtitle}>
            Go deeper with {plusPlanName} — unlimited guidance and detailed
            reports.
          </Text>
        </View>

        {isPremium ? (
          // Already entitled — show the member state instead of a CTA.
          <View style={styles.memberCard}>
            <Text style={styles.memberTitle}>You're on Astropanth Plus ✦</Text>
            <Text style={styles.memberText}>
              Thank you for supporting Astropanth. All Plus features are
              unlocked on this device.
            </Text>
          </View>
        ) : null}

        {/* Plus benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>What's included</Text>
          {plusFeatures.map((feature) => (
            <View key={feature.label} style={styles.benefitRow}>
              <View style={styles.checkIcon}>
                <Check size={14} color="#E8C87E" />
              </View>
              <Text style={styles.benefitText}>{feature.label}</Text>
            </View>
          ))}
        </View>

        {/* Pricing — placeholder amounts */}
        {!isPremium && (
          <>
            <View style={styles.priceRow}>
              {plusPrices.map((price) => (
                <View key={price.id} style={styles.priceCard}>
                  <Text style={styles.priceAmount}>{price.displayPrice}</Text>
                  <Text style={styles.pricePeriod}>{price.period}</Text>
                  {price.note ? (
                    <Text style={styles.priceNote}>{price.note}</Text>
                  ) : null}
                </View>
              ))}
            </View>
            <Text style={styles.placeholderNote}>
              Prices shown are placeholders while we finalise subscriptions.
            </Text>

            {/* Subscribe — disabled until a billing provider is wired. */}
            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonDisabled]}
              disabled
              activeOpacity={1}
              accessibilityLabel="Subscribe (coming soon)"
            >
              <Text style={styles.primaryButtonText}>Subscribe</Text>
            </TouchableOpacity>
            <Text style={styles.comingSoonNote}>Coming soon</Text>

            {/* Restore purchases — no-op for now. */}
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              activeOpacity={0.7}
            >
              <Text style={styles.restoreText}>Restore purchases</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerText}>
            Free features remain free. Astropanth Plus adds extras — your
            current experience won't change.
          </Text>
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
    paddingTop: 52,
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
    fontSize: 28,
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
  placeholderNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7E7B92',
    textAlign: 'center',
    marginTop: 8,
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
