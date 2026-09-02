/// <reference path="../pb_data/types.d.ts" />

// Razorpay payment route for Astropanth (WEB checkout only — Android must use
// Play Billing per Play policy). Two endpoints:
//   POST /create-order   { item, userId }        -> creates a Razorpay order
//   POST /verify-payment { razorpay_order_id, razorpay_payment_id,
//                          razorpay_signature, item, userId } -> verifies + grants
//
// The client (utils/razorpay.web.ts) calls create-order, opens Razorpay Checkout
// with the returned order, and on success calls verify-payment. We verify the
// HMAC signature server-side and return the entitlement to grant. Amounts are
// authoritative here so the client can't change the price.
//
// Deploy:
//   1. Set env vars for the PocketBase service (systemd drop-in or export before
//      start):
//        RAZORPAY_KEY_ID=rzp_test_XXXX
//        RAZORPAY_KEY_SECRET=your_key_secret     (NEVER commit this)
//   2. Copy this file to <pocketbase>/pb_hooks/razorpay.pb.js
//   3. systemctl restart pocketbase

// Authoritative product catalog. amount is in paise (₹1 = 100). days: 0 = permanent.
function PRODUCTS() {
  return {
    plus_monthly:   { plan: "plus",    days: 30,  amount: 9900,  name: "Astropanth Plus (Monthly)" },
    plus_yearly:    { plan: "plus",    days: 365, amount: 49900, name: "Astropanth Plus (Yearly)" },
    reports_all:    { plan: "reports", days: 0,   amount: 14900, name: "Astropanth Reports" },
    // Launch ₹1 offers (enable by pointing the client item id at these):
    plus_launch:    { plan: "plus",    days: 30,  amount: 100,   name: "Astropanth Plus (Launch)" },
    reports_launch: { plan: "reports", days: 0,   amount: 100,   name: "Astropanth Reports (Launch)" },
  };
}

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

routerAdd("POST", "/create-order", (e) => {
  const KEY_ID = $os.getenv("RAZORPAY_KEY_ID");
  const KEY_SECRET = $os.getenv("RAZORPAY_KEY_SECRET");
  if (!KEY_ID || !KEY_SECRET) {
    return e.json(500, { ok: false, message: "Payments are not configured yet." });
  }

  let body = {};
  try { body = e.requestInfo().body || {}; } catch (_) {}
  const item = String(body.item || "");
  const userId = String(body.userId || "");

  const p = PRODUCTS()[item];
  if (!p) return e.json(400, { ok: false, message: "Unknown item." });

  let res;
  try {
    res = $http.send({
      url: "https://api.razorpay.com/v1/orders",
      method: "POST",
      headers: {
        "Authorization": "Basic " + b64encode(KEY_ID + ":" + KEY_SECRET),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: p.amount, currency: "INR", notes: { item: item, userId: userId } }),
      timeout: 20,
    });
  } catch (_) {
    return e.json(502, { ok: false, message: "Could not reach the payment gateway." });
  }
  if (res.statusCode >= 300 || !res.json || !res.json.id) {
    return e.json(502, { ok: false, message: "Could not create the order." });
  }

  return e.json(200, {
    ok: true,
    orderId: res.json.id,
    amount: p.amount,
    currency: "INR",
    keyId: KEY_ID,
    name: p.name,
  });
});

routerAdd("POST", "/verify-payment", (e) => {
  const KEY_SECRET = $os.getenv("RAZORPAY_KEY_SECRET");
  if (!KEY_SECRET) {
    return e.json(500, { ok: false, message: "Payments are not configured yet." });
  }

  let body = {};
  try { body = e.requestInfo().body || {}; } catch (_) {}
  const orderId = String(body.razorpay_order_id || "");
  const paymentId = String(body.razorpay_payment_id || "");
  const signature = String(body.razorpay_signature || "");
  const item = String(body.item || "");
  if (!orderId || !paymentId || !signature) {
    return e.json(400, { ok: false, message: "Missing payment details." });
  }

  // Razorpay signature = HMAC-SHA256(order_id + "|" + payment_id, key_secret), hex.
  const expected = $security.hs256(orderId + "|" + paymentId, KEY_SECRET);
  if (String(expected).toLowerCase() !== signature.toLowerCase()) {
    return e.json(400, { ok: false, message: "Payment could not be verified." });
  }

  const p = PRODUCTS()[item];
  if (!p) return e.json(400, { ok: false, message: "Unknown item." });

  // (Optional) record the payment against the user here in a `payments` collection.
  return e.json(200, { ok: true, plan: p.plan, durationDays: p.days });
});
