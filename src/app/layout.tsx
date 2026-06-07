import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/700.css";
import "../styles/index.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "The Pixel Garden — Anoushka",
  description: "Personal portfolio — an explorable pixel garden.",
  icons: { icon: "/favicon.svg" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "The Pixel Garden — Anoushka",
    description: "Personal portfolio — an explorable pixel garden.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "The Pixel Garden — Anoushka",
    description: "Personal portfolio — an explorable pixel garden.",
  },
  ...(process.env.NEXT_PUBLIC_SITE_URL
    ? { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL) }
    : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="day">
      <head>
        {/* TRD §12 / PRD §11.5 — discover font files early (display=swap on stylesheet) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap"
          rel="stylesheet"
        />
        {/*
          Plausible (TRD §11.2) — embed when ready, e.g.:
          <Script defer data-domain="your-domain" src="https://plausible.io/js/script.js" />
          `src/analytics/plausible.ts` no-ops until window.plausible exists.
        */}
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-ui-bg focus:px-3 focus:py-2 focus:font-pixel focus:text-[10px] focus:text-ui-text focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
