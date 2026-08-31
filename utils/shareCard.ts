import { Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

/**
 * Rasterise an off-screen ShareCard view to a PNG and open the OS share sheet
 * with the image. Falls back to a plain-text share (with the app link) if image
 * capture or the sharing sheet is unavailable, so the button never dead-ends.
 * The web build resolves to shareCard.web.ts, which never imports view-shot.
 */
export async function shareCardImage(
  ref: React.RefObject<any>,
  fallbackMessage: string,
): Promise<boolean> {
  try {
    if (!ref?.current) throw new Error('no card ref');
    const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your Astropanth reading',
        UTI: 'public.png',
      });
      return true;
    }
    await Share.share({ message: fallbackMessage });
    return true;
  } catch {
    try {
      await Share.share({ message: fallbackMessage });
    } catch {
      // user cancelled or unavailable — ignore
    }
    return false;
  }
}
