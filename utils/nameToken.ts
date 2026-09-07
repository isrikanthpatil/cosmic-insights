// Name tokenization for translatable generated prose.
//
// Daily/weekly horoscope sentences embed the user's first name
// (e.g. "Priya, today the Moon..."). If we translate the sentence as-is, every
// user produces a UNIQUE string, so nothing can be cached or pre-warmed — each
// person triggers a fresh translation. By swapping the name for a stable
// "{name}" token before translation and restoring it after, the template becomes
// finite: identical across users (shared server cache) and pre-warmable. The
// translate hook is instructed to preserve {placeholder} tokens, so the token
// survives translation intact.

const TOKEN = '{name}';

/** Replace the user's name with the {name} token before translation. */
export function tokenizeName(s: string, name?: string | null): string {
  if (!s || !name) return s;
  return s.split(name).join(TOKEN);
}

/** Restore the user's name into a (possibly translated) tokenized string. */
export function restoreName(s: string, name?: string | null): string {
  if (!s || !name) return s;
  return s.split(TOKEN).join(name);
}
