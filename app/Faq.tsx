"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Do I need to connect my YouTube account?",
    a: "Not yet. TypeBeatOS currently generates the full upload package — titles, description, tags, thumbnail, pinned comment, and schedule — so you can copy and paste into YouTube Studio. Direct YouTube scheduling is on the roadmap for Pro and above.",
  },
  {
    q: "Does this guarantee more views or sales?",
    a: "No, and we won't pretend otherwise. TypeBeatOS removes the upload admin so you can stay consistent and post SEO-ready packages every time. Consistency and good metadata help — but the music and the market are still yours.",
  },
  {
    q: "Is TypeBeatOS affiliated with YouTube or BeatStars?",
    a: "No. Platform names and logos are used for identification only. TypeBeatOS is an independent tool and is not affiliated with, endorsed by, or partnered with YouTube, BeatStars, or Airbit.",
  },
  {
    q: "What do I actually upload?",
    a: "Your finished beat file. You add the beat name, BPM, key, genre, mood, and target artist, and TypeBeatOS builds the upload pack around it. You can also save default branding and store links in your producer profile so they auto-fill every time.",
  },
  {
    q: "Can I edit what gets generated?",
    a: "Yes. Every title, description, tag set, and pinned comment is fully editable before you export. TypeBeatOS gives you a strong starting point built around real type-beat structures — you keep full control.",
  },
  {
    q: "What happens to my pricing if I join the beta?",
    a: "Early beta users get discounted lifetime pricing and help shape the upload system. We build around real type-beat workflows, not guesses, so your feedback directly influences the roadmap.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="faq-list">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className={`faq-item${isOpen ? " open" : ""}`}>
            <button
              type="button"
              className="faq-q"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span>{item.q}</span>
              <span className="faq-icon" aria-hidden="true">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && <p className="faq-a">{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
