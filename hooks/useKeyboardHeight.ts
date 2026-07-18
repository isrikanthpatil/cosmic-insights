import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';

/**
 * Returns the current on-screen keyboard height in pixels (0 when hidden).
 *
 * Why this exists: with Android edge-to-edge enabled (app.json
 * `edgeToEdgeEnabled`), the standard `KeyboardAvoidingView` no longer lifts
 * inputs correctly. This hook exposes the raw keyboard height so screens can
 * apply their own bottom padding and keep inputs above the keyboard.
 *
 * Web-safe: returns 0 and subscribes to nothing on web (there is no native
 * keyboard event stream there).
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    // iOS emits the "will" events (smoother, fires before the animation);
    // Android only reliably emits the "did" events.
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    };
    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return keyboardHeight;
}

export default useKeyboardHeight;
