import type { MetadataRoute } from "next";

/**
 * Public sitemap. Lists only routes that show prerendered content to a
 * logged-out visitor — landing, waitlist, both auth surfaces (so the
 * login/signup links resolve in search results), and the legal scaffolds.
 *
 * `APP_URL` is set from Fly secrets in production; locally it falls back
 * to the dev origin so the sitemap still validates.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.APP_URL || "https://typebeatos.com").replace(/\/$/, "");
  const today = new Date();

  return [
    { url: `${base}/`,        lastModified: today, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/waitlist`, lastModified: today, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/login`,    lastModified: today, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/signup`,   lastModified: today, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy`,  lastModified: today, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`,    lastModified: today, changeFrequency: "monthly", priority: 0.3 },
  ];
}
