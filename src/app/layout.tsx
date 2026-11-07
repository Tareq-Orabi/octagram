import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";
import "./portfolio.css";
import "./services.css";
import "./journey.css";
import "./eye-outro.css";
import "./surface-motion.css";
import "./vision-roots.css";
import "./project-desktop.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: "Octagram",
  description:
    "A software team based in Jordan building websites, apps and custom systems with thoughtful design and practical AI.",
  alternates: { canonical: "/" },
  icons: { icon: "/assets/brand/logo.svg" },
  openGraph: {
    title: "Octagram",
    description:
      "Thoughtful software from a team in Jordan. Explore our work in web development, custom systems and AI.",
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
  slogan: "Designing impact and engineering beauty",
  description: "A software team based in Jordan.",
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
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/assets/fonts/inter-latin.woff2"
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
