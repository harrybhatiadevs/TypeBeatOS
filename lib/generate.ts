import type { Beat, Profile } from "@prisma/client";

const YEAR = new Date().getFullYear();

// AI provider: Google Gemini (free tier) when GEMINI_API_KEY is set, otherwise
// Anthropic Claude when ANTHROPIC_API_KEY is set. Both are called over plain
// HTTP — no SDK. Override the model per provider without a redeploy.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

/** Whether AI generation is available (a Gemini or Anthropic key is configured). */
export function aiConfigured(): boolean {
  return !!(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

type LlmOptions = { maxTokens: number; json?: boolean; temperature?: number };

/**
 * Prompt the configured model and return its raw text. Gemini is preferred when
 * its key is set; falls back to Claude. Returns null on any failure so callers
 * degrade to hand-writing.
 */
async function callLlm(prompt: string, opts: LlmOptions): Promise<string | null> {
  const gemini = process.env.GEMINI_API_KEY;
  if (gemini) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": gemini },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: opts.maxTokens,
              temperature: opts.temperature ?? 0.9,
              // Gemini 2.5 Flash "thinks" by default, which burns the output
              // budget on these short structured tasks — turn it off.
              thinkingConfig: { thinkingBudget: 0 },
              ...(opts.json ? { responseMimeType: "application/json" } : {}),
            },
          }),
          signal: AbortSignal.timeout(20000),
        },
      );
      if (!res.ok) return null;
      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts;
      const text = Array.isArray(parts)
        ? parts.map((p: { text?: string }) => p?.text ?? "").join("")
        : "";
      return text || null;
    } catch {
      return null;
    }
  }

  const anthropic = process.env.ANTHROPIC_API_KEY;
  if (anthropic) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropic,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: opts.maxTokens,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const text: string = data?.content?.[0]?.text ?? "";
      return text || null;
    } catch {
      return null;
    }
  }

  return null;
}

/** Ensure each space-separated hashtag starts with a single '#'. */
function normalizeHashtags(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((h) => `#${h.replace(/^#+/, "")}`)
    .join(" ");
}

function clean(value?: string | null): string {
  return (value || "").trim().replace(/\s+/g, " ");
}

function phraseKey(value: string): string {
  return clean(value).toLowerCase();
}

function dedupe(items: string[], limit = Number.POSITIVE_INFINITY) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items.map(clean).filter(Boolean)) {
    const key = phraseKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

function titleCasePhrase(value: string): string {
  return clean(value)
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (["x", "and", "ft", "feat"].includes(lower)) return lower;
      if (["r&b", "uk", "ny", "atl"].includes(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function pascalTag(value: string): string {
  return clean(value)
    .split(/[\s\-_/&+]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")
    .replace(/[^a-zA-Z0-9]/g, "");
}

function clipCsv(items: string[], maxChars = 480): string {
  const out: string[] = [];
  let length = 0;
  for (const item of dedupe(items)) {
    const nextLength = length + item.length + (out.length ? 2 : 0);
    if (nextLength > maxChars) break;
    out.push(item);
    length = nextLength;
  }
  return out.join(", ");
}

function producerCredit(profile: Profile | null): string {
  const producer = clean(profile?.producerName) || "me";
  return /^prod\.?\s/i.test(producer) ? producer : `prod. ${producer}`;
}

function contactLines(profile: Profile | null): string[] {
  const lines: string[] = [];
  if (profile?.instagramUrl) lines.push(`📱 Instagram: ${profile.instagramUrl}`);
  if (profile?.contactEmail) lines.push(`📩 Email: ${profile.contactEmail}`);
  if (profile?.youtubeUrl) lines.push(`▶️ YouTube: ${profile.youtubeUrl}`);
  return lines;
}

function purchaseUrl(beat: Beat | null, profile: Profile | null): string {
  return clean(beat?.storeLink) || clean(profile?.storeUrl) || "(add your beat store link in Profile)";
}

function purchaseLabel(beat: Beat | null): string {
  return clean(beat?.storeLink) ? "💰 Purchase / lease this beat:" : "💰 Beat store:";
}

function laneTitle(parts: string[]): string {
  return titleCasePhrase(dedupe(parts).join(" "));
}

export function buildTitleOptions(beat: Beat): string[] {
  const a = beat.targetArtist;
  const b = beat.secondaryArtist;
  const n = `"${beat.name}"`;
  const g = beat.genre;
  const m = beat.mood;

  const options = [
    `[FREE] ${a} Type Beat - ${n}`,
    `${a} Type Beat - ${n}`,
    b ? `${a} x ${b} Type Beat - ${n}` : "",
    g ? `${a} Type Beat - ${n} | ${g} Instrumental` : "",
    b && g ? `${a} x ${b} Type Beat - ${n} | ${g} Instrumental ${YEAR}` : "",
    m && g ? `${a} Type Beat - ${n} | ${m} ${g} Instrumental` : "",
    `${a}${b ? ` x ${b}` : ""} Type Beat ${YEAR} - ${n}`,
    m ? `${m} ${a} Type Beat - ${n}` : "",
  ];
  return dedupe(options);
}

export function buildPackageTitleOptions(beat: Beat, aiTitles: string[] = []): string[] {
  return dedupe([...buildTitleOptions(beat), ...aiTitles], 3);
}

export function buildTags(beat: Beat): string {
  const a = clean(beat.targetArtist).toLowerCase();
  const b = clean(beat.secondaryArtist).toLowerCase();
  const g = clean(beat.genre).toLowerCase();
  const m = clean(beat.mood).toLowerCase();
  const lane = dedupe([m, g]).join(" ");

  const tags = [
    `${a} type beat`,
    `free ${a} type beat`,
    `${a} type beat ${YEAR}`,
    `${a} instrumental`,
    `${a} beat`,
    b ? `${b} type beat` : "",
    b ? `free ${b} type beat` : "",
    b ? `${a} x ${b} type beat` : "",
    b && g ? `${a} x ${b} ${g} type beat` : "",
    lane ? `${lane} ${a} type beat` : "",
    g ? `${g} type beat` : "",
    g ? `${g} instrumental` : "",
    g ? `free ${g} instrumental` : "",
    m && g ? `${m} ${g} type beat` : "",
    m ? `${m} type beat` : "",
    "type beat",
    `type beat ${YEAR}`,
    "instrumental",
    "free instrumental",
    "free type beat",
    beat.bpm ? `${beat.bpm} bpm type beat` : "",
    beat.key ? `${beat.key} instrumental` : "",
    beat.key ? `${beat.key} type beat` : "",
    `${beat.name.toLowerCase()} beat`,
  ];

  // YouTube allows ~500 characters of tags total.
  return clipCsv(tags);
}

export function buildHashtags(beat: Beat): string {
  return dedupe([
    `#${pascalTag(beat.targetArtist)}TypeBeat`,
    beat.genre ? `#${pascalTag(beat.genre)}Instrumental` : "#FreeBeat",
    "#TypeBeat",
  ], 3).join(" ");
}

export function buildDescription(beat: Beat, profile: Profile | null, title: string): string {
  const store = purchaseUrl(beat, profile);
  const tags = buildTags(beat);
  const lines: string[] = [
    title,
    "",
    purchaseLabel(beat),
    store,
    "",
    "✅ FREE download is for non-profit use only.",
    "🔓 For profit use, purchase a license from the link above.",
    `🎹 Must credit (${producerCredit(profile)}).`,
    "",
  ];

  if (beat.licensePrice || beat.exclusivePrice) {
    const prices = [
      beat.licensePrice ? `Lease: $${beat.licensePrice}` : "",
      beat.exclusivePrice ? `Exclusive: $${beat.exclusivePrice}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    lines.push(prices, "");
  }

  lines.push(
    `🎧 BPM: ${beat.bpm ? beat.bpm : "add BPM"}`,
    `🔑 KEY: ${beat.key || "add key"}`,
    `🎼 STYLE: ${beat.targetArtist} type beat${beat.genre ? ` / ${beat.genre}` : ""}${beat.mood ? ` / ${beat.mood}` : ""}`,
    "",
  );

  const contact = contactLines(profile);
  if (contact.length) lines.push("CONTACT:", ...contact, "");

  lines.push(
    "⚠️ This beat is NOT Content ID / copyright free.",
    "Do not register this beat with YouTube Content ID or claim ownership.",
    "",
  );

  if (profile?.licenseText) lines.push(profile.licenseText, "");
  if (profile?.descriptionFooter) lines.push(profile.descriptionFooter, "");

  lines.push(buildHashtags(beat), "", "Tags:", tags);
  return lines.join("\n");
}

export function buildPinnedComment(beat: Beat, profile: Profile | null): string {
  const store = purchaseUrl(beat, profile);
  const lines = [
    `💰 Purchase / lease this beat: ${store}`,
  ];
  if (beat.licensePrice || beat.exclusivePrice) {
    lines.push(
      [
        beat.licensePrice ? `Lease $${beat.licensePrice}` : "",
        beat.exclusivePrice ? `Exclusive $${beat.exclusivePrice}` : "",
      ]
        .filter(Boolean)
        .join(" / ")
    );
  }
  lines.push("🔥 Using this beat? Drop your track in the comments.");
  return lines.join("\n");
}

/**
 * Optional Claude enhancement: extra title options on top of the template ones.
 * No-op when ANTHROPIC_API_KEY is unset; failures fall back silently.
 */
export async function aiTitleOptions(beat: Beat): Promise<string[]> {
  if (!aiConfigured()) return [];
  const prompt = `Write 4 YouTube title options for a type beat. Target artist: ${beat.targetArtist}${beat.secondaryArtist ? `, secondary artist: ${beat.secondaryArtist}` : ""}. Beat name: "${beat.name}". Genre: ${beat.genre || "n/a"}. Mood: ${beat.mood || "n/a"}. Follow real type-beat title conventions (artist keyword first, beat name in quotes). Reply with ONLY a JSON array of 4 strings.`;
  const text = await callLlm(prompt, { maxTokens: 512, json: true });
  if (!text) return [];
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string").slice(0, 4) : [];
  } catch {
    return [];
  }
}

export type AiTemplate = {
  name: string;
  title: string;
  description: string;
  tags: string;
  hashtags: string;
  pinnedComment: string;
};

// The per-beat values a template leaves as placeholders (filled in on import).
const TEMPLATE_PLACEHOLDERS =
  "{beatname}, {artist}, {secondaryartist}, {genre}, {bpm}, {key}, {purchaselink}, {artisttag}, {genretag}";

type LaneTerms = {
  name: string;
  primaryArtist: string;
  secondaryArtists: string[];
  relatedArtists: string[];
  genrePhrases: string[];
  modifiers: string[];
  moods: string[];
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => (typeof item === "string" ? clean(item) : "")).filter(Boolean)
    : [];
}

function looksLikeVibe(value: string): boolean {
  return /\b(trap|drill|r&b|rnb|rap|pluggnb|jersey|afro|latin|rage|melodic|dark|emotional|sad|hard|ambient|psychedelic|guitar|piano|soul|sample|bouncy|club)\b/i.test(
    value,
  );
}

function fallbackLaneTerms(brief: string): LaneTerms {
  const parts = brief.split(/[,\n]+/).map(clean).filter(Boolean);
  const first = parts[0] || brief;
  const xParts = first.split(/\s+x\s+/i).map(clean).filter(Boolean);
  const primaryArtist = xParts[0] || "Artist";
  const secondaryArtists = xParts.slice(1).filter((part) => !looksLikeVibe(part));
  const vibeParts = [
    ...xParts.slice(1).filter(looksLikeVibe),
    ...parts.slice(1),
  ];
  const genres = vibeParts.filter((part) => looksLikeVibe(part));
  const modifiers = vibeParts
    .flatMap((part) => part.split(/\s+/))
    .filter((word) => looksLikeVibe(word) && !/\b(type|beat|instrumental)\b/i.test(word));

  return {
    name: laneTitle([primaryArtist, secondaryArtists[0] || genres[0] || modifiers[0] || "SEO"]),
    primaryArtist,
    secondaryArtists,
    relatedArtists: secondaryArtists,
    genrePhrases: dedupe(genres),
    modifiers: dedupe(modifiers),
    moods: [],
  };
}

async function extractLaneTerms(brief: string): Promise<Partial<LaneTerms> | null> {
  const prompt = `Extract reusable SEO lane terms from this type-beat template brief: "${brief}".

The final deterministic template can use these placeholders later: ${TEMPLATE_PLACEHOLDERS}.
Do not write titles, tags, descriptions, or marketing copy. Return compact JSON only:
{
  "name": "2-4 word lane label",
  "primaryArtist": "main artist name",
  "secondaryArtists": ["optional artists named in the brief"],
  "relatedArtists": ["3-6 adjacent searchable artists for this lane"],
  "genrePhrases": ["1-4 searchable genre phrases like dark trap or melodic r&b"],
  "modifiers": ["1-5 short SEO modifiers like dark, melodic, emotional"],
  "moods": ["1-4 mood words"]
}`;

  const text = await callLlm(prompt, { maxTokens: 700, json: true, temperature: 0.2 });
  if (!text) return null;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    return {
      name: typeof parsed.name === "string" ? clean(parsed.name) : "",
      primaryArtist: typeof parsed.primaryArtist === "string" ? clean(parsed.primaryArtist) : "",
      secondaryArtists: asStringArray(parsed.secondaryArtists),
      relatedArtists: asStringArray(parsed.relatedArtists),
      genrePhrases: asStringArray(parsed.genrePhrases),
      modifiers: asStringArray(parsed.modifiers),
      moods: asStringArray(parsed.moods),
    };
  } catch {
    return null;
  }
}

function mergeLaneTerms(fallback: LaneTerms, extracted: Partial<LaneTerms> | null): LaneTerms {
  return {
    name: clean(extracted?.name) || fallback.name,
    primaryArtist: clean(extracted?.primaryArtist) || fallback.primaryArtist,
    secondaryArtists: dedupe([...(extracted?.secondaryArtists || []), ...fallback.secondaryArtists], 4),
    relatedArtists: dedupe(
      [
        ...(extracted?.relatedArtists || []),
        ...(extracted?.secondaryArtists || []),
        ...fallback.relatedArtists,
      ],
      8,
    ),
    genrePhrases: dedupe([...(extracted?.genrePhrases || []), ...fallback.genrePhrases], 5),
    modifiers: dedupe([...(extracted?.modifiers || []), ...fallback.modifiers], 6),
    moods: dedupe([...(extracted?.moods || []), ...fallback.moods], 5),
  };
}

function buildTemplateTags(terms: LaneTerms): string {
  const related = terms.relatedArtists.flatMap((artist) => [
    `${artist.toLowerCase()} type beat`,
    `free ${artist.toLowerCase()} type beat`,
  ]);
  const genreTags = terms.genrePhrases.flatMap((genre) => [
    `${genre.toLowerCase()} type beat`,
    `${genre.toLowerCase()} instrumental`,
    `free ${genre.toLowerCase()} instrumental`,
  ]);
  const modifierTags = terms.modifiers.flatMap((modifier) => [
    `${modifier.toLowerCase()} {artist} type beat`,
    `${modifier.toLowerCase()} type beat`,
  ]);
  const moodTags = terms.moods.map((mood) => `${mood.toLowerCase()} {artist} type beat`);

  return clipCsv([
    "{artist} type beat",
    "free {artist} type beat",
    `{artist} type beat ${YEAR}`,
    "{artist} type beat instrumental",
    "{artist} instrumental",
    "{artist} beat",
    ...modifierTags,
    ...moodTags,
    ...genreTags,
    ...related,
    "type beat",
    `type beat ${YEAR}`,
    "free type beat",
    "instrumental",
    "free instrumental",
    "{bpm} bpm type beat",
    "{key} type beat",
    "{key} instrumental",
    "{beatname} type beat",
  ]);
}

function buildTemplateFromTerms(brief: string, terms: LaneTerms, profile: Profile | null): AiTemplate {
  const lane = laneTitle([
    ...terms.modifiers.slice(0, 2),
    ...terms.genrePhrases.slice(0, 1),
  ]) || "{genre}";
  const primary = titleCasePhrase(terms.primaryArtist);
  const laneHash = pascalTag(terms.genrePhrases[0] || terms.modifiers[0] || "FreeBeat");
  const contact = contactLines(profile);
  const title = `{artist} Type Beat "{beatname}" ft. {secondaryartist} | ${lane} Instrumental ${YEAR}`;
  const tags = buildTemplateTags(terms);

  const description = [
    title,
    "",
    "💰 Purchase / lease this beat:",
    "{purchaselink}",
    "",
    "✅ FREE download is for non-profit use only.",
    "🔓 For profit use, purchase a license from the link above.",
    `🎹 Must credit (${producerCredit(profile)}).`,
    "",
    "🎧 BPM: {bpm}",
    "🔑 KEY: {key}",
    `🎼 STYLE: {artist} type beat / ${lane}`,
    "",
    ...(contact.length ? ["CONTACT:", ...contact, ""] : []),
    "⚠️ This beat is NOT Content ID / copyright free.",
    "Do not register this beat with YouTube Content ID or claim ownership.",
    "",
    ...(profile?.licenseText ? [profile.licenseText, ""] : []),
    ...(profile?.descriptionFooter ? [profile.descriptionFooter, ""] : []),
    `#{artisttag}TypeBeat #${laneHash} #TypeBeat`,
    "",
    "Tags:",
    tags,
  ].join("\n");

  return {
    name: clean(terms.name) || laneTitle([primary, terms.genrePhrases[0] || "SEO"]) || clean(brief).slice(0, 60),
    title,
    description,
    tags,
    hashtags: normalizeHashtags(`#{artisttag}TypeBeat #${laneHash} #TypeBeat`),
    pinnedComment: [
      "💰 Purchase / lease this beat: {purchaselink}",
      "🔥 Using this beat? Drop your track in the comments.",
    ].join("\n"),
  };
}

/**
 * Generate a reusable, SEO-optimised upload template for an artist lane / vibe.
 * The structure is deterministic; AI only extracts the lane terms that feed it.
 */
export async function aiGenerateTemplate(brief: string, profile: Profile | null = null): Promise<AiTemplate | null> {
  if (!aiConfigured()) return null;
  const fallback = fallbackLaneTerms(brief);
  const extracted = await extractLaneTerms(brief);
  const terms = mergeLaneTerms(fallback, extracted);
  return buildTemplateFromTerms(brief, terms, profile);
}
