import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, Platform } from 'react-native';
import { CircleCheck as CheckCircle, Info as InfoIcon } from 'lucide-react-native';
import { subscribeToast, ToastPayload } from '@/utils/toast';

const AUTO_DISMISS_MS = 2500;

// Renders a single animated toast near the bottom of the screen. Mounted once
// at the app root; subscribes to the module-level toast pub/sub so any screen
// can trigger a message without prop-drilling or context.
export default function ToastHost() {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToast((payload) => {
      // Cancel any pending auto-dismiss from a previous toast.
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }

      setToast(payload);

      // Reset to start position then animate in.
      opacity.setValue(0);
      translateY.setValue(20);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      hideTimer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 20,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start(() => setToast(null));
      }, AUTO_DISMISS_MS);
    });

    return () => {
      unsubscribe();
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [opacity, translateY]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <View style={styles.host} pointerEvents="none">
      <Animated.View
        style={[
          styles.toast,
          isSuccess && styles.toastSuccess,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        {isSuccess ? (
          <CheckCircle size={18} color="#FFD700" />
        ) : (
          <InfoIcon size={18} color="#E0E0E0" />
        )}
        <Text style={styles.message} numberOfLines={3}>
          {toast.message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'web' ? 32 : 96,
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 480,
    backgroundColor: '#1A152E',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  toastSuccess: {
    borderColor: 'rgba(255, 215, 0, 0.5)',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  message: {
    flexShrink: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
});
