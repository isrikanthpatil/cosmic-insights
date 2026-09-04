/// <reference path="../pb_data/types.d.ts" />

// Batch translation for Astropanth's GENERATED content (readings, horoscopes,
// report text). POST /api/translate  body: { texts:[...], lang:"hi" }
//   -> { translations:[...] }  (same length + order; English for anything that
//                               could not be translated)
//
// English (lang "en"/empty) is returned unchanged. Other languages are Groq-
// translated and cached in translation_cache. To stay reliable on long / verbose
// scripts we translate in SMALL internal groups (a big single call can overflow
// the token limit and come back truncated → we'd return English). We only cache
// a REAL translation, so a failed item is retried on the next request instead of
// being permanently stuck in English.

routerAdd("POST", "/api/translate", (e) => {
  const GROQ_KEY = $os.getenv("GROQ_KEY");
  const LANG_NAMES = { hi: "Hindi", mr: "Marathi", kn: "Kannada", ta: "Tamil", te: "Telugu" };
  const GROUP = 12; // strings per Groq call — small enough to never truncate

  let body = {};
  try { body = e.requestInfo().body || {}; } catch (_) {}

  const lang = String(body.lang || "en").toLowerCase();
  let texts = Array.isArray(body.texts) ? body.texts : [];
  texts = texts.slice(0, 100).map((t) => String(t == null ? "" : t).slice(0, 4000));

  if (!LANG_NAMES[lang] || texts.length === 0) {
    return e.json(200, { translations: texts });
  }
  const langName = LANG_NAMES[lang];

  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return String(h >>> 0);
  }

  // Translate one small group; returns an array of the same length, or null if
  // the model response could not be parsed / had the wrong length.
  function translateGroup(group) {
    try {
      const sys =
        "You are a professional translator localizing a Vedic astrology & numerology app. " +
        "Translate each string in the given JSON array from English into " + langName + ". " +
        "Rules: return a JSON array with EXACTLY the same number of items, in the same order; " +
        "preserve every {placeholder} token, number, emoji and line break; keep proper nouns " +
        "(Astropanth, AskAstro, planet/sign/nakshatra names) as commonly written in " + langName +
        "; natural, warm, everyday " + langName + " in its native script. " +
        "Return ONLY the JSON array — no keys, no markdown, no commentary.";
      const gr = $http.send({
        url: "https://api.groq.com/openai/v1/chat/completions",
        method: "POST",
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: JSON.stringify(group) },
          ],
          temperature: 0.2,
          max_tokens: 6000,
        }),
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_KEY },
        timeout: 45,
      });
      if (gr.statusCode !== 200) return null;
      let content = (gr.json && gr.json.choices && gr.json.choices[0] &&
                     gr.json.choices[0].message && gr.json.choices[0].message.content) || "";
      content = ("" + content).trim();
      const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fence) { content = fence[1].trim(); }
      const arr = JSON.parse(content);
      if (Array.isArray(arr) && arr.length === group.length) return arr;
      return null;
    } catch (_) {
      return null;
    }
  }

  const out = new Array(texts.length);
  const missIdx = [];
  const missText = [];

  // 1) Cache lookup.
  for (let i = 0; i < texts.length; i++) {
    const src = texts[i];
    if (!src.trim()) { out[i] = src; continue; }
    let hit = null;
    try {
      hit = $app.findFirstRecordByFilter(
        "translation_cache", "lang = {:l} && h = {:h}", { l: lang, h: hash(src) }
      );
    } catch (_) { hit = null; }
    if (hit) { out[i] = hit.getString("tr") || src; }
    else { missIdx.push(i); missText.push(src); }
  }

  // 2) Translate misses in small groups (with one retry per group).
  for (let g = 0; g < missText.length; g += GROUP) {
    const group = missText.slice(g, g + GROUP);
    let arr = translateGroup(group);
    if (!arr) arr = translateGroup(group); // one retry
    for (let k = 0; k < group.length; k++) {
      const i = missIdx[g + k];
      const src = group[k];
      const val = (arr && typeof arr[k] === "string" && arr[k].trim()) ? arr[k] : null;
      // Return null when we could NOT translate — the client keeps English and
      // retries later, so a failure never sticks. A real result (even one that
      // equals English, e.g. a proper noun) is returned and cached, so it is not
      // re-translated on every request.
      out[i] = val;
      if (val) {
        try {
          const c = $app.findCollectionByNameOrId("translation_cache");
          $app.save(new Record(c, { h: hash(src), lang, en: src.slice(0, 4000), tr: val }));
        } catch (_) {}
      }
    }
  }

  return e.json(200, { translations: out });
});
