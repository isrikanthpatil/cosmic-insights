/// <reference path="../pb_data/types.d.ts" />

// Batch translation for Astropanth's GENERATED content (readings, horoscopes,
// report text) — the dynamic prose that isn't in the bundled UI dictionaries.
//
// POST /api/translate   body: { "texts": ["...", "..."], "lang": "hi" }
//   -> { "translations": ["...", "..."] }   (same length + order as input)
//
// English (lang "en" or empty) is returned unchanged. Every other string is
// translated with Groq and cached in the `translation_cache` collection so each
// unique (lang,text) pair is only ever paid for once. If that collection does
// not exist, translation still works — it just doesn't cache.
//
// Deploy:
//   1. (Recommended) In the admin UI create collection `translation_cache`:
//        h     text    (required)      // hash of the source text
//        lang  text    (required)
//        en    text                    // source (for debugging)
//        tr    text                    // translated value
//      Add a composite index on (lang, h). Lock all API rules to admin-only —
//      this hook runs with $app so it still reads/writes it.
//   2. Ensure GROQ_KEY is set in the environment (same as askastro.pb.js).
//   3. Copy this file to <pocketbase>/pb_hooks/translate.pb.js and restart.

routerAdd("POST", "/api/translate", (e) => {
  const GROQ_KEY = $os.getenv("GROQ_KEY");
  const LANG_NAMES = { hi: "Hindi", mr: "Marathi", kn: "Kannada", ta: "Tamil", te: "Telugu" };

  let body = {};
  try { body = e.requestInfo().body || {}; } catch (_) {}

  const lang = String(body.lang || "en").toLowerCase();
  let texts = Array.isArray(body.texts) ? body.texts : [];
  // Guardrails: cap batch size and per-item length.
  texts = texts.slice(0, 80).map((t) => String(t == null ? "" : t).slice(0, 4000));

  // English (or unknown language) — nothing to do.
  if (!LANG_NAMES[lang] || texts.length === 0) {
    return e.json(200, { translations: texts });
  }
  const langName = LANG_NAMES[lang];

  // Small stable string hash (matches the app's cache key scheme).
  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return String(h >>> 0);
  }

  const out = new Array(texts.length);
  const missIdx = [];
  const missText = [];

  // 1) Try the cache for each item.
  for (let i = 0; i < texts.length; i++) {
    const src = texts[i];
    if (!src.trim()) { out[i] = src; continue; }
    const h = hash(src);
    let hit = null;
    try {
      hit = $app.findFirstRecordByFilter(
        "translation_cache", "lang = {:l} && h = {:h}", { l: lang, h }
      );
    } catch (_) { hit = null; } // collection missing or lookup failed → treat as miss
    if (hit) {
      out[i] = hit.getString("tr") || src;
    } else {
      missIdx.push(i);
      missText.push(src);
    }
  }

  // 2) Translate the misses in one Groq call.
  if (missText.length > 0) {
    let translated = null;
    try {
      const sys =
        "You are a professional translator localizing a Vedic astrology & numerology app. " +
        "Translate each string in the given JSON array from English into " + langName + ". " +
        "Rules: keep the same number of items in the same order; preserve any {placeholder} tokens, " +
        "numbers, emojis, line breaks, and proper nouns (Astropanth, AskAstro, and planet/sign/" +
        "nakshatra names may stay as commonly written in " + langName + "); use natural, warm, " +
        "everyday " + langName + "; keep well-known Sanskrit astrology terms but in " + langName +
        " script. Return ONLY a JSON array of the translated strings — no keys, no commentary.";
      const gr = $http.send({
        url: "https://api.groq.com/openai/v1/chat/completions",
        method: "POST",
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: JSON.stringify(missText) },
          ],
          temperature: 0.2,
          max_tokens: 4000,
        }),
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_KEY },
        timeout: 45,
      });
      if (gr.statusCode === 200) {
        let content = (gr.json && gr.json.choices && gr.json.choices[0] &&
                       gr.json.choices[0].message && gr.json.choices[0].message.content) || "";
        content = ("" + content).trim();
        // Strip a ```json fence if the model added one.
        const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fence) { content = fence[1].trim(); }
        const arr = JSON.parse(content);
        if (Array.isArray(arr) && arr.length === missText.length) { translated = arr; }
      }
    } catch (_) { translated = null; }

    for (let j = 0; j < missIdx.length; j++) {
      const i = missIdx[j];
      const src = missText[j];
      // Fall back to English for any item we couldn't translate — never break the UI.
      const val = (translated && typeof translated[j] === "string" && translated[j].trim())
        ? translated[j] : src;
      out[i] = val;
      // Best-effort cache write (skip silently if the collection is absent).
      if (translated) {
        try {
          const c = $app.findCollectionByNameOrId("translation_cache");
          const rec = new Record(c, { h: hash(src), lang, en: src.slice(0, 4000), tr: val });
          $app.save(rec);
        } catch (_) {}
      }
    }
  }

  return e.json(200, { translations: out });
});
