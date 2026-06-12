import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TypeBeatOS — Upload a month of type beats in one sitting",
  description:
    "TypeBeatOS generates SEO titles, descriptions, tags, thumbnails, pinned comments, and upload schedules so you can focus on making beats.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
