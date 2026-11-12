import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";
import "./portfolio.css";
import "./services.css";
import "./journey.css";
import "./eye-outro.css";
import "./surface-motion.css";
import "./cinematic.css";
import "./studio-sections.css";

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
  themeColor: "#080909",
  colorScheme: "dark",
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
const initializeIntro = `try{document.documentElement.classList.add("js-enabled");if((location.pathname==='/'||location.pathname==='/index.html')&&!location.hash&&!new URLSearchParams(location.search).has('skiploader')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('site-loading');setTimeout(function(){var r=document.documentElement;if(r.classList.contains('site-loading')){r.classList.remove('site-loading','site-entering');r.classList.add('experience-entered');var l=document.querySelector('.site-loader');if(l)l.hidden=true;dispatchEvent(new Event('octagram:entered'))}},10000)}}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-octagram-build="octagram-studio-20261112"
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preload"
          href="/assets/fonts/manrope-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/assets/fonts/space-grotesk-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
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
