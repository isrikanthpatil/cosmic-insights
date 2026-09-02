import type { EntitlementScope } from '@/contexts/PremiumContext';

export type CheckoutResult =
  | { ok: true; plan: EntitlementScope; untilMs?: number; message: string }
  | { ok: false; message: string };

/**
 * Native stub. Razorpay Checkout is a web flow; on Android digital purchases must
 * go through Google Play Billing (Play policy), which is wired separately. The
 * real implementation lives in razorpay.web.ts.
 */
export async function startCheckout(
  _item: string,
  _opts?: { userId?: string; email?: string },
): Promise<CheckoutResult> {
  return { ok: false, message: 'Purchases are available on the web for now.' };
}
