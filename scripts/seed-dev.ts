/**
 * Dev seed script. Wipes any existing test accounts (cascade deletes
 * profile, sessions, beats, packages, YouTubeAccount) and creates a
 * predictable fixture so every dev session starts ready:
 *
 *   - 1 test user — test@typebeatos.local / review123!
 *   - Producer profile (Drake / Travis Scott focus)
 *   - 3 beats in three different states (raw, draft package, scheduled
 *     package) so every UI screen has something to render
 *
 * Usage:
 *   CONFIRM_SEED=yes npx tsx scripts/seed-dev.ts
 *
 * The CONFIRM_SEED gate + NODE_ENV=production refuse keeps this script
 * from ever running against a real customer database.
 */
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const TEST_EMAIL = "test@typebeatos.local";
const TEST_PASSWORD = "review123!";

const BEATS = [
  {
    name: "Late Night",
    targetArtist: "Drake",
    secondaryArtist: "PARTYNEXTDOOR",
    genre: "R&B Trap",
    mood: "Moody",
    bpm: 140,
    key: "C# minor",
    licensePrice: "29.99",
    exclusivePrice: "299",
  },
  {
    name: "Midnight Drive",
    targetArtist: "Travis Scott",
    secondaryArtist: "Don Toliver",
    genre: "Trap",
    mood: "Dark",
    bpm: 152,
    key: "F minor",
    licensePrice: "34.99",
    exclusivePrice: "399",
  },
  {
    name: "Free Throws",
    targetArtist: "Drake",
    secondaryArtist: "",
    genre: "Trap",
    mood: "Bouncy",
    bpm: 145,
    key: "G minor",
    licensePrice: "29.99",
    exclusivePrice: "299",
  },
];

function fixtureTitles(beatName: string, artist: string): string[] {
  return [
    `${artist} type beat "${beatName}"`,
    `[FREE] ${artist} type beat - ${beatName}`,
    `${beatName} | ${artist} type beat 2026`,
  ];
}

function fixtureDescription(beatName: string, artist: string): string {
  return [
    `🎵 "${beatName}" — ${artist} type beat`,
    "",
    "📩 Buy / lease: https://beatstars.com/typebeatos",
    "💬 For exclusive: beats@typebeatos.local",
    "",
    "🎧 New beats every Mon / Wed / Fri",
    "👉 Subscribe so you don't miss the next one",
    "",
    "Tags: " + ["type beat", artist.toLowerCase(), "trap", "free beat"].join(", "),
  ].join("\n");
}

async function main() {
  if (process.env.CONFIRM_SEED !== "yes") {
    console.error("Refusing to run without CONFIRM_SEED=yes");
    process.exit(2);
  }
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to seed a production database");
    process.exit(2);
  }

  // Wipe first — cascade deletes session, profile, beats, packages, YT account.
  await db.user.deleteMany({ where: { email: TEST_EMAIL } });

  const user = await db.user.create({
    data: {
      email: TEST_EMAIL,
      passwordHash: bcrypt.hashSync(TEST_PASSWORD, 10),
      onboardedAt: new Date(),
      profile: {
        create: {
          producerName: "prod. test",
          contactEmail: TEST_EMAIL,
          storeUrl: "https://beatstars.com/typebeatos",
          youtubeUrl: "https://youtube.com/@typebeatos",
          instagramUrl: "https://instagram.com/typebeatos",
          licenseText:
            "Free downloads are for non-profit use only. Must credit (prod. test). For monetised use, purchase a lease.",
          descriptionFooter:
            "New beats every Mon / Wed / Fri. Subscribe so you don't miss the next one.",
          scheduleDays: "1,3,5",
          scheduleTime: "18:00",
        },
      },
    },
  });

  // Three beats with three different package states so every UI surface has
  // something to render.
  for (let i = 0; i < BEATS.length; i++) {
    const data = BEATS[i];
    const beat = await db.beat.create({
      data: {
        userId: user.id,
        ...data,
      },
    });

    if (i === 0) continue; // first beat stays "raw" (no package yet)

    // Beat 2 + 3 get a package; beat 3 is scheduled, beat 2 is draft.
    const titles = fixtureTitles(beat.name, beat.targetArtist);
    const scheduledAt =
      i === 2 ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null;
    await db.package.create({
      data: {
        beatId: beat.id,
        titleOptions: JSON.stringify(titles),
        selectedTitle: titles[0],
        description: fixtureDescription(beat.name, beat.targetArtist),
        tags: [
          "type beat",
          beat.targetArtist.toLowerCase(),
          beat.genre.toLowerCase(),
          beat.mood.toLowerCase(),
          "free beat",
        ].join(", "),
        hashtags: `#typebeat #${beat.targetArtist.toLowerCase().replace(/\s+/g, "")}typebeat #freebeat`,
        pinnedComment: `🎵 Buy / lease: https://beatstars.com/typebeatos\n📩 Exclusive: ${TEST_EMAIL}`,
        status: scheduledAt ? "scheduled" : "draft",
        scheduledAt,
      },
    });
  }

  console.log("✓ Seeded dev DB");
  console.log("  email:    " + TEST_EMAIL);
  console.log("  password: " + TEST_PASSWORD);
  console.log("  beats:    3 (1 raw, 1 draft package, 1 scheduled package)");
  console.log("  log in at /login");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
