# Purchases ledger + warmer AskAstro — server setup (no app build)

Two server-only changes. Both go live on a PocketBase restart.

---

## A. Purchases ledger

Records every verified Plus purchase into a `purchases` collection, so you have a
server-side record of who paid, what, and when (the app entitlement is still
local; this is your ledger for support/refunds/analytics).

### 1. Create the `purchases` collection (admin UI)

Collections → **New collection** → Base → name `purchases`, fields:

| field | type |
|-------|------|
| `userId` | text |
| `item` | text |
| `plan` | text |
| `durationDays` | number |
| `orderId` | text |
| `paymentId` | text |
| `amount` | number |
| `currency` | text |

Leave the API rules **locked** (admin-only) — the hook runs with `$app`, and no
client should read/write this.

### 2. Patch the verify-payment hook (on the server)

Run this on the server (python3 is already there). It adds the ledger write to
your existing `razorpay.pb.js`:

```bash
cd ~/pocketbase/pb_hooks
cp razorpay.pb.js razorpay.pb.js.bak
python3 - <<'PY'
p="razorpay.pb.js"; s=open(p,encoding="utf-8").read()
old='''  const item = String((ores.json.notes && ores.json.notes.item) || "");
  const p = PRODUCTS[item];
  if (!p) return e.json(400, { ok: false, message: "Unknown item." });

  return e.json(200, { ok: true, plan: p.plan, durationDays: p.days });'''
new='''  const notes = ores.json.notes || {};
  const item = String(notes.item || "");
  const p = PRODUCTS[item];
  if (!p) return e.json(400, { ok: false, message: "Unknown item." });
  try {
    const c = $app.findCollectionByNameOrId("purchases");
    $app.save(new Record(c, { userId: String(notes.userId || ""), item: item, plan: p.plan, durationDays: p.days, orderId: orderId, paymentId: paymentId, amount: ores.json.amount || 0, currency: ores.json.currency || "INR" }));
  } catch (_) {}
  return e.json(200, { ok: true, plan: p.plan, durationDays: p.days });'''
if old in s:
    open(p,"w",encoding="utf-8").write(s.replace(old,new,1)); print("razorpay.pb.js patched OK")
else:
    print("!! anchor not found — your razorpay.pb.js differs; tell me and I'll send the full file")
PY
```

*(If it prints "anchor not found", your server copy predates the order-verify
change — ping me for the full file.)*

---

## B. Warmer AskAstro replies

Makes the chat feel more like a caring family astrologer. Patches the first
system prompt in `askastro.pb.js`:

```bash
cd ~/pocketbase/pb_hooks
cp askastro.pb.js askastro.pb.js.bak3
python3 - <<'PY'
p="askastro.pb.js"; s=open(p,encoding="utf-8").read()
old='''messages.push({ role: "system", content: "You are AskAstro, a warm, wise and encouraging Vedic (sidereal/Lahiri) astrologer and numerologist speaking with " + name + ". Speak the way a trusted family astrologer would: kind, personal and grounded, never robotic. Address " + name + " by name naturally, keep replies warm and specific to their chart and numbers, and open with a gentle acknowledgement when it fits. You discuss only astrology, numerology, horoscopes, zodiac signs, and the user's own chart and numbers." });'''
new='''messages.push({ role: "system", content: "You are AskAstro — a warm, caring and encouraging Vedic (sidereal/Lahiri) astrologer and numerologist, speaking personally with " + name + ". Talk like a trusted family astrologer who genuinely cares: kind, gentle, hopeful and human, never clinical or robotic. Greet " + name + " warmly by name, meet their question with empathy, and make every reply feel personal to their own chart and numbers. Offer reassurance and gentle, practical guidance, and leave them feeling understood and encouraged. You discuss only astrology, numerology, horoscopes, zodiac signs, and the user's own chart and numbers." });'''
if old in s:
    open(p,"w",encoding="utf-8").write(s.replace(old,new,1)); print("askastro.pb.js prompt updated")
else:
    print("!! exact prompt not found — your file differs; tell me and I'll match it")
PY
```

---

## C. Restart + verify

```bash
sudo systemctl restart pocketbase

# AskAstro still answers (and should feel warmer):
curl -sk https://api.astropanth.com/api/ask -H 'Content-Type: application/json' \
  -d '{"question":"I am a bit worried about my career, any guidance?","lang":"en"}'
```

Then, to confirm the ledger, do one **₹1** web purchase and check the `purchases`
collection in the admin UI — a new row should appear with the order/payment IDs.
(Refund the ₹1 afterward.)
