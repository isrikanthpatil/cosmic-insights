/// <reference path="../pb_data/types.d.ts" />

// Promo-code redemption for Astropanth Plus.
//
// POST /redeem-code   body: { "code": "FAMILY30", "userId": "<optional>" }
// Validates the code against the `codes` collection (exists, active, not expired,
// uses remaining), records the redemption, and returns { ok, plan, durationDays }.
// The React Native client then grants the local Plus entitlement. This lets us
// hand free access to friends/testers while everyone else pays.
//
// Deploy:
//   1. In the PocketBase admin UI create a collection named `codes` with fields:
//        code         text    (required, unique)   e.g. "FAMILY30"
//        plan         text    (default "plus")
//        durationDays number  (0 = permanent, else an N-day grant)
//        maxUses      number  (0 = unlimited)
//        usedCount    number  (default 0)
//        expiresAt    date    (optional; code invalid after this date)
//        active       bool    (default true)
//        redeemedBy   json    (optional; list of userIds)
//      Lock its API rules to admin-only — this hook runs with $app (admin) so it
//      still works, and the collection stays unreadable/unwritable by clients.
//   2. Copy this file to  <pocketbase>/pb_hooks/redeem_code.pb.js
//   3. systemctl restart pocketbase

routerAdd("POST", "/redeem-code", (e) => {
  let body = {};
  try { body = e.requestInfo().body || {}; } catch (_) {}

  const code = String(body.code || "").trim().toUpperCase();
  const userId = String(body.userId || "");
  if (code.length < 3) {
    return e.json(400, { ok: false, message: "Enter a valid code." });
  }

  // Look the code up (exact match on the uppercased code). We check `active` in
  // JS rather than in the SQL filter so a bool/field issue can't silently hide a
  // real record. findRecordsByFilter returns [] when nothing matches (no throw).
  let recs = [];
  try {
    recs = $app.findRecordsByFilter("codes", "code = {:code}", "-created", 1, 0, { code });
  } catch (err) {
    // Almost always a collection/field-name mismatch — surface it so we can fix it.
    return e.json(500, { ok: false, message: "Code lookup failed: " + String(err) });
  }
  if (!recs || recs.length === 0) {
    return e.json(404, { ok: false, message: "That code isn't valid." });
  }
  const rec = recs[0];
  if (!rec.getBool("active")) {
    return e.json(403, { ok: false, message: "This code is not active." });
  }

  // Expiry (date field is empty string when unset).
  const expStr = rec.getString("expiresAt");
  if (expStr && !isNaN(Date.parse(expStr)) && Date.parse(expStr) < Date.now()) {
    return e.json(410, { ok: false, message: "This code has expired." });
  }

  // Usage limit.
  const maxUses = rec.getInt("maxUses");
  const usedCount = rec.getInt("usedCount");
  if (maxUses > 0 && usedCount >= maxUses) {
    return e.json(409, { ok: false, message: "This code has reached its limit." });
  }

  // Record the redemption.
  rec.set("usedCount", usedCount + 1);
  if (userId) {
    let redeemedBy = [];
    try { redeemedBy = rec.get("redeemedBy") || []; } catch (_) {}
    if (Array.isArray(redeemedBy) && redeemedBy.indexOf(userId) === -1) {
      redeemedBy.push(userId);
      rec.set("redeemedBy", redeemedBy);
    }
  }
  try { $app.save(rec); } catch (_) {}

  return e.json(200, {
    ok: true,
    plan: rec.getString("plan") || "plus",
    durationDays: rec.getInt("durationDays") || 0,
  });
});
