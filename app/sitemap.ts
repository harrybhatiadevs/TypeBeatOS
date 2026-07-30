import type { MetadataRoute } from "next";
import { CANONICAL_ORIGIN } from "@/lib/site-url";

/**
 * Public sitemap. Lists only routes that show prerendered content to a
 * logged-out visitor and that should appear in search. Authentication and
 * account-recovery routes deliberately use noindex and stay out of this file.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = CANONICAL_ORIGIN;
  const today = new Date();

  return [
    { url: `${base}/`,        lastModified: today, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/waitlist`, lastModified: today, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/youtube`,  lastModified: today, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy`,  lastModified: today, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`,    lastModified: today, changeFrequency: "monthly", priority: 0.3 },
  ];
}
