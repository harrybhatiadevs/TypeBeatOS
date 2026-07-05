import type { Beat, Profile } from "@prisma/client";

const YEAR = new Date().getFullYear();

// Claude Haiku 4.5 is the cheapest model and plenty for short SEO copy. Override
// with ANTHROPIC_MODEL (e.g. claude-opus-4-8) for higher quality without a redeploy.
const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

/** Whether AI generation is available (an Anthropic key is configured). */
export function aiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

function dedupe(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

export function buildTitleOptions(beat: Beat): string[] {
  const a = beat.targetArtist;
  const b = beat.secondaryArtist;
  const n = `"${beat.name}"`;
  const g = beat.genre;
  const m = beat.mood;

  const options = [
    `${a} Type Beat - ${n}`,
    b ? `${a} x ${b} Type Beat - ${n}` : "",
    g ? `${a} Type Beat - ${n} | ${g} Instrumental` : "",
    b && g ? `${a} x ${b} Type Beat - ${n} | ${g} Instrumental ${YEAR}` : "",
    m && g ? `${a} Type Beat - ${n} | ${m} ${g} Instrumental` : "",
    `${a}${b ? ` x ${b}` : ""} Type Beat ${YEAR} - ${n}`,
    m ? `${m} ${a} Type Beat - ${n}` : "",
    `[FREE] ${a} Type Beat - ${n}`,
  ];
  return dedupe(options);
}

export function buildTags(beat: Beat): string {
  const a = beat.targetArtist.toLowerCase();
  const b = beat.secondaryArtist.toLowerCase();
  const g = beat.genre.toLowerCase();
  const m = beat.mood.toLowerCase();

  const tags = dedupe([
    `${a} type beat`,
    `free ${a} type beat`,
    `${a} type beat ${YEAR}`,
    b ? `${b} type beat` : "",
    b ? `${a} x ${b} type beat` : "",
    g ? `${g} type beat` : "",
    g ? `${g} instrumental` : "",
    g ? `free ${g} instrumental` : "",
    m && g ? `${m} ${g} beat` : "",
    m ? `${m} type beat` : "",
    "type beat",
    `type beat ${YEAR}`,
    "instrumental",
    "free type beat",
    beat.bpm ? `${beat.bpm} bpm beat` : "",
    beat.key ? `${beat.key} instrumental` : "",
    `${beat.name.toLowerCase()} beat`,
  ]);

  // YouTube allows ~500 characters of tags total
  let out: string[] = [];
  let len = 0;
  for (const t of tags) {
    if (len + t.length + 2 > 480) break;
    out.push(t);
    len += t.length + 2;
  }
  return out.join(", ");
}

export function buildHashtags(beat: Beat): string {
  const pascal = (s: string) =>
    s
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("")
      .replace(/[^a-zA-Z0-9]/g, "");
  return dedupe([
    `#${pascal(beat.targetArtist)}TypeBeat`,
    "#TypeBeat",
    beat.genre ? `#${pascal(beat.genre)}Instrumental` : "",
  ]).join(" ");
}

export function buildDescription(beat: Beat, profile: Profile | null, title: string): string {
  const store = beat.storeLink || profile?.storeUrl || "";
  const lines: string[] = [title, ""];

  if (store) lines.push(`💰 Purchase this beat (untagged): ${store}`);
  if (beat.licensePrice || beat.exclusivePrice) {
    const prices = [
      beat.licensePrice ? `Lease: $${beat.licensePrice}` : "",
      beat.exclusivePrice ? `Exclusive: $${beat.exclusivePrice}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    lines.push(prices);
  }
  lines.push("");

  const specs = [
    beat.bpm ? `${beat.bpm} BPM` : "",
    beat.key || "",
    beat.genre || "",
    beat.mood || "",
  ]
    .filter(Boolean)
    .join(" · ");
  if (specs) lines.push(`🎹 ${specs}`, "");

  if (profile?.licenseText) lines.push(profile.licenseText, "");

  const contact: string[] = [];
  if (profile?.contactEmail) contact.push(`📩 Contact: ${profile.contactEmail}`);
  if (profile?.instagramUrl) contact.push(`📸 Instagram: ${profile.instagramUrl}`);
  if (profile?.youtubeUrl) contact.push(`▶️ Subscribe: ${profile.youtubeUrl}`);
  if (contact.length) lines.push(...contact, "");

  const producer = profile?.producerName || "me";
  const credit = /^prod\.?\s/i.test(producer) ? producer : `prod. ${producer}`;
  lines.push(`Must credit (${credit}) when using this beat.`, "");

  if (profile?.descriptionFooter) lines.push(profile.descriptionFooter, "");

  lines.push(buildHashtags(beat));
  return lines.join("\n");
}

export function buildPinnedComment(beat: Beat, profile: Profile | null): string {
  const store = beat.storeLink || profile?.storeUrl || "";
  const lines = [
    `💰 Purchase this beat → ${store || "(add your store link)"}`,
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
  lines.push(`🔥 Using this beat? Drop your track in the replies — I check all of them.`);
  return lines.join("\n");
}

/**
 * Optional Claude enhancement: extra title options on top of the template ones.
 * No-op when ANTHROPIC_API_KEY is unset; failures fall back silently.
 */
export async function aiTitleOptions(beat: Beat): Promise<string[]> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: `Write 4 YouTube title options for a type beat. Target artist: ${beat.targetArtist}${beat.secondaryArtist ? `, secondary artist: ${beat.secondaryArtist}` : ""}. Beat name: "${beat.name}". Genre: ${beat.genre || "n/a"}. Mood: ${beat.mood || "n/a"}. Follow real type-beat title conventions (artist keyword first, beat name in quotes). Reply with ONLY a JSON array of 4 strings.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
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
const TEMPLATE_PLACEHOLDERS = "{beatname}, {artist}, {secondaryartist}, {genre}, {bpm}, {key}";

/**
 * Generate a reusable, SEO-optimised upload template for an artist lane / vibe.
 * Returns null when no API key is set or the model call fails, so callers can
 * surface a friendly error and fall back to hand-writing the template.
 */
export async function aiGenerateTemplate(brief: string): Promise<AiTemplate | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const prompt = `You are an expert at YouTube SEO for "type beat" instrumental producers.
Generate ONE reusable upload template for this artist lane / vibe: "${brief}".

The template is reused across many beats, so use these placeholders wherever a
per-beat value belongs (they are substituted on each upload): ${TEMPLATE_PLACEHOLDERS}.
Always lead the title with the {artist} keyword and put {beatname} in quotes.

Follow real type-beat SEO conventions:
- name: a 2-4 word label for this lane (e.g. "Drake x Latin").
- title: keyword-first, includes "{artist} Type Beat", "{beatname}" in quotes, and optionally {genre} and the year ${YEAR}. ~70 characters, no more than 100.
- tags: comma-separated, 15-20 high-intent search phrases such as "{artist} type beat", "free {artist} type beat", "{genre} instrumental", "type beat ${YEAR}". TOTAL under 480 characters.
- hashtags: exactly 3, space-separated, no commas, PascalCase (e.g. "#DrakeTypeBeat #LatinTrap #TypeBeat").
- description: a few short lines — a purchase call-to-action line, a specs line using {bpm}/{key}/{genre}, and a "must credit" line. Keep it generic (no real links or emails).
- pinnedComment: 2 short lines — a purchase call-to-action and an engagement prompt.

Reply with ONLY a JSON object with exactly these keys: name, title, description, tags, hashtags, pinnedComment.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const p = JSON.parse(match[0]) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const title = str(p.title);
    if (!title) return null; // a template with no title isn't useful
    return {
      name: str(p.name) || brief.slice(0, 60),
      title,
      description: str(p.description),
      tags: str(p.tags),
      hashtags: str(p.hashtags),
      pinnedComment: str(p.pinnedComment),
    };
  } catch {
    return null;
  }
}
