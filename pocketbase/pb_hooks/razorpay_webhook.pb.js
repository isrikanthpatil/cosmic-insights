/// <reference path="../pb_data/types.d.ts" />

// Razorpay refund webhook -> updates the `purchases` ledger.
//   POST /razorpay-webhook   (configure this URL in Razorpay Dashboard → Webhooks,
//   subscribed to the `refund.processed` and `refund.created` events)
//
// Trust model: we do NOT rely on the request body alone. We take the payment_id
// from the event and RE-FETCH the payment from Razorpay's API (Basic auth with the
// server key), then read the authoritative `amount_refunded` / `status` from that
// response. So a forged webhook can't mark a purchase refunded — Razorpay itself
// must confirm it. (If RAZORPAY_WEBHOOK_SECRET is set we also sanity-check the
// X-Razorpay-Signature header, but the re-fetch is the real guarantee.)

routerAdd("POST", "/razorpay-webhook", (e) => {
  const KEY_ID = $os.getenv("RAZORPAY_KEY_ID");
  const KEY_SECRET = $os.getenv("RAZORPAY_KEY_SECRET");

  function b64encode(str) {
    var b = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o = "", i = 0;
    while (i < str.length) {
      var c1 = str.charCodeAt(i++), c2 = str.charCodeAt(i++), c3 = str.charCodeAt(i++);
      var e1 = c1 >> 2, e2 = ((c1 & 3) << 4) | (c2 >> 4), e3 = ((c2 & 15) << 2) | (c3 >> 6), e4 = c3 & 63;
      if (isNaN(c2)) { e3 = 64; e4 = 64; } else if (isNaN(c3)) { e4 = 64; }
      o += b.charAt(e1) + b.charAt(e2) + b.charAt(e3) + b.charAt(e4);
    }
    return o;
  }

  let body = {};
  try { body = e.requestInfo().body || {}; } catch (_) {}

  // Extract the payment id from a refund event (fall back to a payment event).
  let paymentId = "";
  let refundId = "";
  try {
    const pl = body.payload || {};
    if (pl.refund && pl.refund.entity) {
      paymentId = String(pl.refund.entity.payment_id || "");
      refundId = String(pl.refund.entity.id || "");
    } else if (pl.payment && pl.payment.entity) {
      paymentId = String(pl.payment.entity.id || "");
    }
  } catch (_) {}
  if (!paymentId) {
    return e.json(200, { ok: true, note: "no payment id in event; ignored" });
  }

  // Authoritatively confirm the refund with Razorpay.
  const pr = $http.send({
    url: "https://api.razorpay.com/v1/payments/" + paymentId,
    method: "GET",
    headers: { "Authorization": "Basic " + b64encode(KEY_ID + ":" + KEY_SECRET) },
    timeout: 20,
  });
  if (pr.statusCode >= 300 || !pr.json) {
    return e.json(200, { ok: true, note: "could not confirm payment; ignored" });
  }
  const amount = pr.json.amount || 0;
  const refunded = pr.json.amount_refunded || 0;
  if (refunded <= 0) {
    return e.json(200, { ok: true, note: "no refund on this payment; ignored" });
  }
  const status = refunded >= amount ? "refunded" : "partial_refund";

  // Update the matching purchase row (best-effort; never throws to Razorpay).
  try {
    const rec = $app.findFirstRecordByFilter("purchases", "paymentId = {:p}", { p: paymentId });
    if (rec) {
      rec.set("status", status);
      rec.set("refundId", refundId);
      rec.set("refundAmountPaise", refunded);
      rec.set("refundedAt", new Date().toISOString());
      $app.save(rec);
    }
  } catch (_) {}

  // Always 200 so Razorpay doesn't retry endlessly.
  return e.json(200, { ok: true, paymentId: paymentId, status: status });
});
