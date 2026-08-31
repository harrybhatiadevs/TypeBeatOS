/**
 * Turn a producer's exported filename into the beat's actual name.
 *
 * Type-beat exports carry a lot of packaging around the one word that is the
 * name: `[FREE] Drake Type Beat - "Midnight" (prod. xyz) 140bpm Amin.mp3`.
 * Only "Midnight" belongs in the name field — the artist, BPM and key are
 * separate columns, and the promo tags belong nowhere. Every rule below strips
 * one of those wrappers; anything we can't confidently classify is kept, since
 * the result lands in an editable field where a stray word is cheap and a
 * deleted name is not.
 */

const EXTENSION = /\.[^.\s]{1,5}$/;

/** A double-quoted span is the strongest possible signal: it *is* the title. */
const QUOTED = /[“"«]\s*([^”"«»]{2,60}?)\s*[”"»]/;

/** `[FREE]`, `(prod. xyz)`, `{tagged}` — packaging, never the name. */
const BRACKETED = /[[({][^\])}]*[\])}]/g;

/** Leading export/track index: `01 - `, `03. `. */
const TRACK_NUMBER = /^\s*\d{1,3}\s*[.\-_)]\s+/;

/** Everything up to and including `type beat` is artist + promo, not the name. */
const TYPE_BEAT = /^.*?\btype\s*-?\s*beats?\b/i;

/** `prod. Harry`, `produced by Harry`, `prod by Harry` through the next break. */
const PROD_CREDIT = /\bprod(?:uced)?\.?\s*(?:by\s*)?[^-|~]*/gi;

/** Promo words that never belong to a title. */
const PROMO = /\b(?:free\s*(?:for\s*profit|dl|download)?|untagged|tagged|no\s*tag|exclusive|buy\s*\d*|official|hq)\b/gi;

const BPM = /\b(?:\d{2,3}\s*bpm|bpm\s*\d{2,3})\b/gi;

/**
 * Collab/producer handles: `@miche2x`, and a bare `@` left by a producer who
 * typed the separator without a name. The trailing `*` matters: a lone `@` used
 * to survive and, by sitting after the key, stopped the trailing key rule from
 * ever matching (`... Guitar Ebmaj @`).
 */
const HANDLES = /@[\w.]*/g;

/** Trailing key signature: `Amin`, `F# minor`, `Bbm`, `Cmaj`. */
const KEY_EXPLICIT = /[\s\-_|~]*\b[A-G][#b♯♭]?\s*(?:min(?:or)?|maj(?:or)?)\b\s*$/i;
/** Bare `Am` / `F#m` — only safe on filenames already proven to be exports. */
const KEY_BARE = /[\s\-_|~]*\b[A-G][#b♯♭]?m\b\s*$/;

/** Mix/version state, only meaningful at the end. */
const VERSION = /[\s\-_|~]*\b(?:final|master(?:ed)?|mix(?:down)?|mixed|remaster(?:ed)?|v\.?\d+|version|demo|draft|full|edit|clean|dirty)\b\s*$/i;

const YEAR = /\b(?:19|20)\d{2}\b/g;

/** Markers that prove the filename is a producer export, not a plain title. */
const EXPORT_MARKER = /\btype\s*-?\s*beats?\b|\bbpm\b|\bprod(?:uced)?\b|\bfree\b/i;

/** Stays lowercase inside a title, but never as the first or last word. */
const MINOR_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "nor", "of", "in", "on", "at",
  "to", "for", "from", "by", "with", "as", "vs", "into", "over",
]);

/** Capitalize a word unless it already carries deliberate casing (NYC, McQueen). */
function capitalize(word: string): string {
  if (!word) return word;
  const letters = word.replace(/[^A-Za-z]/g, "");
  // All-caps short words are acronyms the producer meant (NYC, OVO, LA).
  if (letters.length > 1 && letters.length <= 4 && letters === letters.toUpperCase()) return word;
  // Internal capitals are deliberate (McQueen, iPhone, DaBaby).
  if (/[A-Z]/.test(word.slice(1))) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function titleCase(value: string): string {
  const words = value.split(/\s+/).filter(Boolean);
  return words
    .map((word, index) => {
      const bare = word.replace(/[^A-Za-z]/g, "").toLowerCase();
      if (index > 0 && index < words.length - 1 && MINOR_WORDS.has(bare)) return word.toLowerCase();
      return capitalize(word);
    })
    .join(" ");
}

/** Collapse leftover separators and punctuation into a clean single-spaced name. */
function tidy(value: string): string {
  return value
    .replace(/[_|~–—]+/g, " ")
    .replace(/\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-_|~.,'"]+|[\s\-_|~.,'"]+$/g, "")
    .trim();
}

/** Convert an uploaded filename into an editable beat name. */
export function beatNameFromFilename(filename: string): string {
  const stem = filename.replace(EXTENSION, "").replace(/[_]+/g, " ").trim();
  if (!stem) return "";

  const isExport = EXPORT_MARKER.test(stem);

  // A quoted span is unambiguous — take it and skip the guesswork.
  const quoted = stem.match(QUOTED);
  if (quoted) {
    const name = tidy(quoted[1]);
    if (name) return titleCase(name);
  }

  let work = stem;

  // Drop packaging, but only while something survives it.
  const unbracketed = work.replace(BRACKETED, " ");
  if (tidy(unbracketed)) work = unbracketed;

  work = work.replace(TRACK_NUMBER, " ");

  // `<artist> type beat` is a prefix; the name is whatever follows it.
  const afterTypeBeat = work.replace(TYPE_BEAT, " ");
  if (tidy(afterTypeBeat)) work = afterTypeBeat;

  for (const pattern of [PROD_CREDIT, PROMO, HANDLES, BPM, YEAR]) {
    const stripped = work.replace(pattern, " ");
    if (tidy(stripped)) work = stripped;
  }

  // Trailing metadata can stack: `... final Amin`. Peel until nothing matches.
  const trailing = isExport ? [KEY_EXPLICIT, KEY_BARE, VERSION] : [KEY_EXPLICIT, VERSION];
  let peeled = true;
  while (peeled) {
    peeled = false;
    for (const pattern of trailing) {
      const stripped = work.replace(pattern, "");
      if (stripped !== work && tidy(stripped)) {
        work = stripped;
        peeled = true;
      }
    }
  }

  const name = tidy(work);
  // Never hand back nothing: an imperfect name beats an empty required field.
  return titleCase(name || tidy(stem) || stem);
}

/** Comparable stem used for the initial audio/image pairing. */
export function normalizedFileStem(filename: string): string {
  const name = beatNameFromFilename(filename)
    .toLowerCase()
    .replace(/\b(?:cover|art|artwork|thumbnail|thumb)\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
  // Pairing needs *some* key; fall back to the raw stem when cleaning empties it.
  return name || filename.replace(EXTENSION, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
