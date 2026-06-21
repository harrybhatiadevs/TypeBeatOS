import type { Metadata } from "next";
import "./globals.css";

const APP_URL = process.env.APP_URL || "https://typebeatos.com";
const TITLE = "TypeBeatOS — Upload a month of type beats in one sitting";
const DESCRIPTION =
  "TypeBeatOS generates SEO titles, descriptions, tags, thumbnails, pinned comments, and upload schedules so you can focus on making beats.";

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
    "beat producer",
    "youtube uploads",
    "beat scheduling",
    "type beat SEO",
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
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
