const PB_URL = process.env.EXPO_PUBLIC_PB_URL ?? 'https://api.astropanth.com';

export type RedeemResult =
  | { ok: true; plan: string; untilMs?: number; message: string }
  | { ok: false; message: string };

/**
 * Redeem a promo code against the server (`/redeem-code` PocketBase hook). The
 * server validates the code (exists, active, not expired, uses remaining) and
 * records the redemption; the client then grants the local entitlement. Codes
 * let us hand free Plus access to friends/testers while everyone else pays.
 */
export async function redeemCode(code: string, userId?: string): Promise<RedeemResult> {
  const clean = code.trim().toUpperCase();
  if (clean.length < 3) return { ok: false, message: 'Please enter a valid code.' };
  try {
    const res = await fetch(`${PB_URL}/redeem-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: clean, userId: userId ?? '' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      return { ok: false, message: data?.message || 'That code isn’t valid or has expired.' };
    }
    const untilMs = data.durationDays
      ? Date.now() + Number(data.durationDays) * 86_400_000
      : undefined;
    const plan = data.plan === 'plus' ? 'plus' : 'reports';
    const what = plan === 'plus' ? 'Astropanth Plus' : 'Reports';
    return {
      ok: true,
      plan,
      untilMs,
      message: untilMs
        ? `${what} unlocked for ${data.durationDays} days ✨`
        : `${what} unlocked ✨`,
    };
  } catch {
    return { ok: false, message: 'Couldn’t reach the server. Check your connection and try again.' };
  }
}
