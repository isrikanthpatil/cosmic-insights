/**
 * Web fallback for share cards. The native image-capture path (view-shot) is not
 * bundled for web; instead we use the Web Share API with the text + app link when
 * available. Returns false if sharing isn't supported so callers can show a hint.
 */
export async function shareCardImage(
  _ref: React.RefObject<any>,
  fallbackMessage: string,
): Promise<boolean> {
  try {
    const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav?.share) {
      await nav.share({ text: fallbackMessage });
      return true;
    }
  } catch {
    // cancelled or unsupported
  }
  return false;
}
