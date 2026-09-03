# AskAstro — reply in the user's language (`/api/ask` hook)

The app **already sends** the selected language in the request body:

```
POST /api/ask   body: { question, context, history, lang }
```

`lang` is `"en"` (default), `"hi"`, `"mr"`, or `"kn"` (Kannada). Right now the
server ignores it, so AskAstro always answers in English. This snippet makes it
answer in the chosen language — a **server-only** change (no app rebuild).

Edit the `/api/ask` hook on the server (the `.pb.js` file that builds the prompt
and calls Groq — it lives in `pb_hooks/` on the PocketBase box, not in this
repo).

---

## 1. Read `lang` from the body

Where the hook already parses the request body, make sure `lang` is captured
(mirrors the style used in `redeem_code.pb.js`):

```js
let body = {};
try { body = e.requestInfo().body || {}; } catch (_) {}

const question = String(body.question || "");
// ...existing context/history reads...
const langCode = String(body.lang || "en").toLowerCase();
```

## 2. Append a language instruction to the system prompt

Right after the existing `systemPrompt` is built, and **before** it's sent to
Groq, add:

```js
const LANG_NAMES = { en: "English", hi: "Hindi", mr: "Marathi", kn: "Kannada" };
const langName = LANG_NAMES[langCode] || "English";

if (langName !== "English") {
  systemPrompt +=
    "\n\nIMPORTANT: Reply entirely in " + langName + ". Use natural, everyday " +
    langName + " that an ordinary person understands. You may keep well-known " +
    "Sanskrit/astrology terms (rashi, nakshatra, dasha, graha, etc.) but explain " +
    "them in " + langName + ". Do not answer in English, and do not translate the " +
    "user's question back to them — just answer.";
}
```

If `systemPrompt` is a `const`, change it to `let`, or append when you assemble
the messages array, e.g. `messages[0].content += ...`.

## 3. Restart & test

```bash
sudo systemctl restart pocketbase

# Hindi
curl -s https://api.astropanth.com/api/ask -H 'Content-Type: application/json' \
  -d '{"question":"What is my lucky colour today?","lang":"hi"}'

# Marathi
curl -s https://api.astropanth.com/api/ask -H 'Content-Type: application/json' \
  -d '{"question":"Tell me about Mesha rashi","lang":"mr"}'
```

You should get replies in Devanagari (Hindi/Marathi) / Kannada script. `en` and
any unknown code fall back to English, so existing behaviour is unchanged.

> Note: this translates AskAstro's *chat* replies only. Translating the
> generated **reports/horoscope templates** is the separate "Phase 2"
> localization work you chose to hold for now.
