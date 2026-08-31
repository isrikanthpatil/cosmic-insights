import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Share, StyleProp, ViewStyle } from 'react-native';
import { Share2 } from 'lucide-react-native';
import ShareCard, { ShareCardData } from './ShareCard';
import { shareCardImage } from '@/utils/shareCard';
import { tap } from '@/utils/haptics';

/**
 * A drop-in "Share" pill that carries its own off-screen ShareCard and capture
 * logic. On native it rasterises the branded card to a PNG and opens the share
 * sheet; on web it falls back to the Web Share API with the text + app link.
 * Screens only need to pass the card `data` and a text `message` fallback.
 */
export default function ShareCardButton({
  data,
  message,
  label = 'Share',
  style,
}: {
  data: ShareCardData;
  message: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const cardRef = useRef<View>(null);

  const onPress = async () => {
    tap();
    try {
      if (Platform.OS === 'web') {
        const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;
        if (nav?.share) await nav.share({ text: message });
        return;
      }
      await shareCardImage(cardRef, message);
    } catch {
      try { await Share.share({ message }); } catch {}
    }
  };

  return (
    <>
      {Platform.OS !== 'web' && (
        <View style={styles.offscreen} pointerEvents="none">
          <ShareCard ref={cardRef} data={data} />
        </View>
      )}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, style]}
        accessibilityRole="button"
        accessibilityLabel="Share"
        hitSlop={8}
      >
        <Share2 size={15} color="#E8C87E" />
        <Text style={styles.txt}>{label}</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  offscreen: { position: 'absolute', left: -10000, top: 0 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(232,200,126,0.35)',
    backgroundColor: 'rgba(232,200,126,0.08)',
  },
  btnPressed: { opacity: 0.7 },
  txt: { color: '#E8C87E', fontSize: 13, fontFamily: 'Inter-SemiBold' },
});
