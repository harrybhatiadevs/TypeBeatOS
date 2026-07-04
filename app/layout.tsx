import type { Metadata } from "next";
import "./globals.css";

const APP_URL = process.env.APP_URL || "https://typebeatos.com";
const TITLE = "TypeBeatOS — YouTube upload automation for type-beat producers";
const DESCRIPTION =
  "Upload type beats faster with AI metadata, SEO optimised titles, generated thumbnails, rendered videos, and scheduled YouTube uploads.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: TITLE,
    template: "%s · TypeBeatOS",
  },
  description: DESCRIPTION,
  applicationName: "TypeBeatOS",
  authors: [{ name: "TypeBeatOS" }],
  keywords: [
    "type beats",
    "upload type beats",
    "YouTube upload automation",
    "beat producer",
    "type beat producer",
    "youtube uploads",
    "beat scheduling",
    "schedule uploads",
    "type beat SEO",
    "SEO optimised",
    "generate thumbnails",
    "AI metadata",
    "music producer tools",
  ],
  openGraph: {
    type: "website",
    siteName: "TypeBeatOS",
    title: TITLE,
    description: DESCRIPTION,
    url: APP_URL,
    locale: "en_US",
    // Image picked up automatically from app/opengraph-image.tsx via the
    // file convention — Next emits the correct og:image + dimensions.
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    // ?v=2 cache-buster: browsers cache favicons in a separate, very sticky
    // store; bumping the URL forces a fresh fetch of the opaque dark badge.
    icon: [
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
      // PNG fallbacks for Safari / older browsers — opaque dark badge
      { url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192x192.png?v=2", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png?v=2",
    apple: "/apple-touch-icon.png?v=2",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Set the theme before first paint so there's no flash of the wrong
            theme. Dark is the brand default; an explicit user choice wins. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("tb-theme");if(t==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400..900;1,14..32,400..900&family=Inter+Tight:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
