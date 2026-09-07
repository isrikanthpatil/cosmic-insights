/// <reference path="../pb_data/types.d.ts" />

// RevenueCat webhook -> unified `purchases` ledger (Android / Play rail).
//   POST /revenuecat-webhook
//   Configure in RevenueCat Dashboard → Project → Integrations → Webhooks:
//     URL:  https://api.astropanth.com/revenuecat-webhook
//     Authorization header: a shared secret you also set here as RC_WEBHOOK_AUTH.
//
// RevenueCat has already validated the purchase with Google Play before it fires
// this event, so we trust it once the Authorization header matches. We upsert by
// the store transaction id so retries/duplicates don't create duplicate rows.
//
// RC event `price` is in major currency units (e.g. 99.00 INR), which maps
// straight onto our normalized `amount_inr` field (Razorpay uses paise → /100).

routerAdd("POST", "/revenuecat-webhook", (e) => {
  const AUTH = $os.getenv("RC_WEBHOOK_AUTH");

  // 1) Shared-secret auth (RevenueCat sends the exact value you configure).
  let hdr = "";
  try { hdr = e.request.header.get("Authorization") || ""; } catch (_) {}
  if (!AUTH || hdr !== AUTH) {
    return e.json(401, { ok: false, message: "unauthorized" });
  }

  let body = {};
  try { body = e.requestInfo().body || {}; } catch (_) {}
  const ev = body.event || {};
  const type = String(ev.type || "");

  // Only Play-store events belong in this rail (ignore App Store etc. for now).
  const store = String(ev.store || "");
  if (store && store !== "PLAY_STORE") {
    return e.json(200, { ok: true, note: "non-Play store ignored: " + store });
  }

  const txId = String(ev.transaction_id || ev.id || "");
  const userId = String(ev.app_user_id || "");
  const productId = String(ev.product_id || "");
  const entIds = Array.isArray(ev.entitlement_ids) ? ev.entitlement_ids : [];
  const plan = entIds.indexOf("plus") >= 0 ? "plus"
             : entIds.indexOf("reports") >= 0 ? "reports" : "";
  const priceInr = typeof ev.price === "number" ? ev.price : 0;
  const currency = String(ev.currency || "INR");

  // Map RC event type -> ledger status.
  const REFUND = { CANCELLATION: 0, EXPIRATION: 0 }; // cancellations are not refunds
  let status = "paid";
  if (type === "REFUND" || type === "REFUND_REVERSED") {
    status = type === "REFUND" ? "refunded" : "paid";
  } else if (type === "SUBSCRIPTION_PAUSED" || type === "EXPIRATION") {
    // Access naturally lapses; keep the row but don't call it a refund.
    status = "expired";
  }

  if (!txId) {
    return e.json(200, { ok: true, note: "no transaction id; ignored" });
  }

  try {
    const c = $app.findCollectionByNameOrId("purchases");
    let rec = null;
    try {
      rec = $app.findFirstRecordByFilter("purchases", "paymentId = {:t}", { t: txId });
    } catch (_) { rec = null; }
    if (!rec) rec = new Record(c);

    rec.set("provider", "google_play");
    rec.set("userId", userId);
    rec.set("item", productId);
    if (plan) rec.set("plan", plan);
    rec.set("paymentId", txId);
    rec.set("amount_inr", priceInr);
    rec.set("amount_paise", Math.round(priceInr * 100));
    rec.set("currency", currency);
    rec.set("status", status);
    if (status === "refunded") {
      rec.set("refundAmountPaise", Math.round(priceInr * 100));
      rec.set("refundedAt", new Date().toISOString());
    }
    $app.save(rec);
  } catch (_) {}

  return e.json(200, { ok: true, type: type, status: status });
});
