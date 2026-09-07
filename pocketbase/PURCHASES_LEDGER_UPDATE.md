# Purchases ledger — amount fix + refund tracking (and Play-ready)

Two fixes, plus the schema shape that lets Razorpay and Google Play share one ledger.

## 1. Amount was stored in paise (₹1 looked like ₹100)

Razorpay works in **paise** (₹1 = 100 paise); the hook stored that raw value in
`amount`, so a ₹1 sale reads as 100. Fixed in `razorpay.pb.js` — new rows now write:
- `amount_paise` — raw integer, source of truth (100)
- `amount_inr` — human rupee value (1.00), which also normalizes against Play's
  **micros** (₹1 = 1,000,000 micros) so both providers land in the same column.

**Correct the one existing row** (PB Admin → Collections → `purchases` → open the ₹1
record): set `amount_paise = 100`, `amount_inr = 1`, `status = paid`,
`provider = razorpay`. (The old `amount = 100` was correct in paise, just mislabeled.)

## 2. Refund tracking

Add these fields to the `purchases` collection (PB Admin → the collection → New field):

| field | type | notes |
|---|---|---|
| `provider` | Select | values: `razorpay`, `google_play` (default `razorpay`) |
| `status` | Select | values: `paid`, `refunded`, `partial_refund`, `failed` (default `paid`) |
| `amount_paise` | Number | integer paise |
| `amount_inr` | Number | rupees (paise/100, or Play micros/1e6) |
| `refundId` | Text | Razorpay/Play refund id |
| `refundAmountPaise` | Number | amount refunded, paise |
| `refundedAt` | Date | when the refund was confirmed |

(You can keep or delete the old `amount` field; new writes don't use it.)

## 3. Refund webhook (auto-flips status)

`pocketbase/pb_hooks/razorpay_webhook.pb.js` adds `POST /razorpay-webhook`. It takes
the payment id from the event, **re-fetches the payment from Razorpay's API** to
confirm the refund (so a forged webhook can't mark anything refunded), then sets
`status` + refund fields on the matching row.

Setup:
1. Deploy both hooks: `scp pocketbase/pb_hooks/razorpay.pb.js pocketbase/pb_hooks/razorpay_webhook.pb.js root@168.144.189.243:~/pocketbase/pb_hooks/` (PocketBase auto-reloads).
2. Razorpay Dashboard → **Settings → Webhooks → Add**: URL `https://api.astropanth.com/razorpay-webhook`, events **`refund.created`** and **`refund.processed`**. (A webhook secret is optional; the API re-fetch is the real guard. If you set one, store it as `RAZORPAY_WEBHOOK_SECRET`.)
3. Test with a small real refund from the dashboard and confirm the row flips to `refunded`.

## 4. Entitlement on refund

The ledger now records refunds, but to actually **revoke access** on a full refund,
the entitlement check should treat rows with `status != "paid"` as inactive (i.e.
don't count a `refunded` purchase toward Plus/Reports access). Wire this where
entitlement is computed when we build the Play Billing flow.

## 5. Why this is also the Play Billing foundation

Play purchases will write to this same `purchases` collection with
`provider = google_play`, `amount_inr = priceMicros / 1e6`, `status = paid`, and Play
refunds (via Real-time Developer Notifications / Voided Purchases API) update the same
`status` field. One ledger, one entitlement rule, both payment rails.
