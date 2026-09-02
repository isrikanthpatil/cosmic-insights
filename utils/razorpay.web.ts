import type { EntitlementScope } from '@/contexts/PremiumContext';

const PB_URL = process.env.EXPO_PUBLIC_PB_URL ?? 'https://api.astropanth.com';
const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export type CheckoutResult =
  | { ok: true; plan: EntitlementScope; untilMs?: number; message: string }
  | { ok: false; message: string };

let scriptPromise: Promise<boolean> | null = null;
function loadCheckoutScript(): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(false);
  const w: any = window;
  if (w.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = CHECKOUT_SRC;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Web Razorpay checkout: create an order server-side, open Razorpay Checkout,
 * then verify the payment server-side and return the entitlement to grant.
 * The key_id comes back from the server (never hard-coded); the key_secret
 * never leaves the server.
 */
export async function startCheckout(
  item: string,
  opts?: { userId?: string; email?: string },
): Promise<CheckoutResult> {
  try {
    const orderRes = await fetch(`${PB_URL}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item, userId: opts?.userId ?? '' }),
    });
    const order = await orderRes.json().catch(() => ({}));
    if (!orderRes.ok || !order?.ok) {
      return { ok: false, message: order?.message || 'Could not start checkout.' };
    }

    const loaded = await loadCheckoutScript();
    if (!loaded) return { ok: false, message: 'Could not load the payment window.' };

    return await new Promise<CheckoutResult>((resolve) => {
      const w: any = window;
      const rzp = new w.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Astropanth',
        description: order.name,
        theme: { color: '#E8C87E' },
        prefill: opts?.email ? { email: opts.email } : undefined,
        handler: async (resp: any) => {
          try {
            const vr = await fetch(`${PB_URL}/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...resp, item, userId: opts?.userId ?? '' }),
            });
            const v = await vr.json().catch(() => ({}));
            if (vr.ok && v?.ok) {
              const untilMs = v.durationDays ? Date.now() + Number(v.durationDays) * 86_400_000 : undefined;
              resolve({ ok: true, plan: v.plan === 'plus' ? 'plus' : 'reports', untilMs, message: 'Payment successful ✨' });
            } else {
              resolve({ ok: false, message: v?.message || 'Payment could not be verified.' });
            }
          } catch {
            resolve({ ok: false, message: 'Payment verification failed. If you were charged, contact support.' });
          }
        },
        modal: { ondismiss: () => resolve({ ok: false, message: 'Payment cancelled.' }) },
      });
      rzp.open();
    });
  } catch {
    return { ok: false, message: 'Something went wrong starting checkout.' };
  }
}
