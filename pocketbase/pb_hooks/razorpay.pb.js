/// <reference path="../pb_data/types.d.ts" />

// Razorpay payment route for Astropanth (WEB checkout only — Android must use
// Play Billing per Play policy). Two endpoints:
//   POST /create-order   { item, userId }        -> creates a Razorpay order
//   POST /verify-payment { razorpay_order_id, razorpay_payment_id,
//                          razorpay_signature, item, userId } -> verifies + grants
//
// NOTE: PocketBase runs each route handler in its own isolated JS runtime, so
// top-level helpers are NOT visible inside handlers — every handler defines its
// own PRODUCTS catalog (and base64 helper) inline.
//
// Deploy:
//   1. Set env vars for the PocketBase service and restart it:
//        RAZORPAY_KEY_ID=rzp_test_XXXX
//        RAZORPAY_KEY_SECRET=your_key_secret     (NEVER commit this)
//   2. Copy this file to <pocketbase>/pb_hooks/razorpay.pb.js
//   3. Restart PocketBase.

routerAdd("POST", "/create-order", (e) => {
 try {
  // Authoritative catalog. amount in paise (₹1 = 100). days: 0 = permanent.
  const PRODUCTS = {
    plus_monthly:   { plan: "plus",    days: 30,  amount: 9900,  name: "Astropanth Plus (Monthly)" },
    plus_yearly:    { plan: "plus",    days: 365, amount: 49900, name: "Astropanth Plus (Yearly)" },
    reports_all:    { plan: "reports", days: 0,   amount: 14900, name: "Astropanth Reports" },
    plus_launch:    { plan: "plus",    days: 30,  amount: 100,   name: "Astropanth Plus (Launch)" },
    reports_launch: { plan: "reports", days: 0,   amount: 100,   name: "Astropanth Reports (Launch)" },
  };

  // Minimal ASCII base64 (Goja has no btoa) for the Razorpay Basic auth header.
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

  const KEY_ID = $os.getenv("RAZORPAY_KEY_ID");
  const KEY_SECRET = $os.getenv("RAZORPAY_KEY_SECRET");
  if (!KEY_ID || !KEY_SECRET) {
    return e.json(500, { ok: false, message: "Payments are not configured yet." });
  }

  let body = {};
  try { body = e.requestInfo().body || {}; } catch (_) {}
  const item = String(body.item || "");
  const userId = String(body.userId || "");

  const p = PRODUCTS[item];
  if (!p) return e.json(400, { ok: false, message: "Unknown item." });

  const res = $http.send({
    url: "https://api.razorpay.com/v1/orders",
    method: "POST",
    headers: {
      "Authorization": "Basic " + b64encode(KEY_ID + ":" + KEY_SECRET),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: p.amount, currency: "INR", notes: { item: item, userId: userId } }),
    timeout: 20,
  });
  if (res.statusCode >= 300 || !res.json || !res.json.id) {
    var detail = "";
    try {
      detail = (res.json && res.json.error && res.json.error.description)
        ? res.json.error.description
        : String(res.raw || res.body || "");
    } catch (_) {}
    return e.json(502, { ok: false, message: "Razorpay error (" + res.statusCode + "): " + detail });
  }

  return e.json(200, {
    ok: true,
    orderId: res.json.id,
    amount: p.amount,
    currency: "INR",
    keyId: KEY_ID,
    name: p.name,
  });
 } catch (err) {
    return e.json(500, { ok: false, message: "create-order error: " + String(err) });
 }
});

routerAdd("POST", "/verify-payment", (e) => {
 try {
  const PRODUCTS = {
    plus_monthly:   { plan: "plus",    days: 30 },
    plus_yearly:    { plan: "plus",    days: 365 },
    reports_all:    { plan: "reports", days: 0 },
    plus_launch:    { plan: "plus",    days: 30 },
    reports_launch: { plan: "reports", days: 0 },
  };

  const KEY_ID = $os.getenv("RAZORPAY_KEY_ID");
  const KEY_SECRET = $os.getenv("RAZORPAY_KEY_SECRET");
  if (!KEY_ID || !KEY_SECRET) {
    return e.json(500, { ok: false, message: "Payments are not configured yet." });
  }

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
  const orderId = String(body.razorpay_order_id || "");
  const paymentId = String(body.razorpay_payment_id || "");
  const signature = String(body.razorpay_signature || "");
  if (!orderId || !paymentId || !signature) {
    return e.json(400, { ok: false, message: "Missing payment details." });
  }

  // 1) Signature authenticity = HMAC-SHA256(order_id + "|" + payment_id, key_secret), hex.
  const expected = $security.hs256(orderId + "|" + paymentId, KEY_SECRET);
  if (String(expected).toLowerCase() !== signature.toLowerCase()) {
    return e.json(400, { ok: false, message: "Payment could not be verified." });
  }

  // 2) Fetch the order from Razorpay and derive the item from ITS notes — never
  //    trust the client's `item` (a valid signature could otherwise be replayed
  //    to claim a more expensive plan). Also require the order to be paid.
  const ores = $http.send({
    url: "https://api.razorpay.com/v1/orders/" + orderId,
    method: "GET",
    headers: { "Authorization": "Basic " + b64encode(KEY_ID + ":" + KEY_SECRET) },
    timeout: 20,
  });
  if (ores.statusCode >= 300 || !ores.json) {
    return e.json(400, { ok: false, message: "Could not confirm the order." });
  }
  if (ores.json.status !== "paid") {
    return e.json(400, { ok: false, message: "Payment not captured yet." });
  }
  const item = String((ores.json.notes && ores.json.notes.item) || "");
  const p = PRODUCTS[item];
  if (!p) return e.json(400, { ok: false, message: "Unknown item." });

  return e.json(200, { ok: true, plan: p.plan, durationDays: p.days });
 } catch (err) {
    return e.json(500, { ok: false, message: "verify-payment error: " + String(err) });
 }
});
