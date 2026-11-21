import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";
import "./portfolio.css";
import "./services.css";
import "./journey.css";
import "./eye-outro.css";
import "./surface-motion.css";
import "./cinematic.css";
import "./chapter-motion.css";
import "./polish.css";
import "./refinements.css";
import "./studios.css";
import "./team-stage.css";
import "./v14.css";
import "./discovery.css";
import "./stage-refinements.css";
import "./team-workshops.css";
import "./work-showcase.css";
import "./portfolio-studio.css";
import "./interaction-polish.css";
import "./working-together.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: "Octagram",
  description:
    "Jordan-based software engineering and digital innovation. Explore Octagram's web platforms, custom software, AI, healthcare and education projects, and the team behind them.",
  alternates: { canonical: "/" },
  icons: { icon: "/assets/brand/logo.svg" },
  openGraph: {
    title: "Octagram — Designing Impact. Engineering Beauty.",
    description:
      "Software engineering, digital innovation, and artificial intelligence. From ambitious ideas to exceptional digital experiences.",
    url: siteConfig.siteUrl,
    siteName: "Octagram",
    type: "website",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
  colorScheme: "dark",
  viewportFit: "cover",
};

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Octagram",
  url: siteConfig.siteUrl,
  logo: new URL("/assets/brand/logo.svg", siteConfig.siteUrl).href,
  slogan: "Designing Impact. Engineering Beauty.",
  description: "Jordan-based software engineering and digital innovation team.",
  address: { "@type": "PostalAddress", addressCountry: "JO" },
  sameAs: siteConfig.socialLinks.map((link) => link.url),
};

// Runs before paint; no JavaScript / reduced motion / deep links keep direct access.
const initializeIntro = `try {
  const r = document.documentElement;
  r.classList.add('js-enabled');
  r.classList.toggle('journey-paused', matchMedia('(prefers-reduced-motion: reduce)').matches);
  if ((location.pathname === '/' || location.pathname === '/index.html') && (!location.hash || location.hash === '#home') && !new URLSearchParams(location.search).has('skiploader') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    r.classList.add('site-loading');
    setTimeout(function () {
      if (!r.classList.contains('site-loading')) return;
      if (r.dataset.introCoordinated === 'true') { dispatchEvent(new Event('octagram:intro-complete')); return; }
      r.dataset.introTimedOut = 'true'; r.dataset.heroLayoutReady = 'true'; r.dataset.heroTextReady = 'true'; r.dataset.heroVisible = 'true';
      document.querySelectorAll('.decode-row').forEach(function (e) { e.style.setProperty('--decode-reveal','1'); });
      const h = document.querySelector('.binary-headline'); if (h) h.dataset.decode = 'settled';
      const b = document.querySelector('.nav-brand'); if (b) b.dataset.brandPhase = 'settled';
      r.classList.remove('site-loading','site-entering'); r.classList.add('experience-entered');
      const l = document.querySelector('.site-loader'); if (l) l.hidden = true;
      dispatchEvent(new Event('octagram:entered'));
    }, 10000);
  }
} catch (e) {}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" data-octagram-build="octagram-cinematic-20261121-34" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/assets/fonts/manrope-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="preload" href="/assets/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: initializeIntro }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organization).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
