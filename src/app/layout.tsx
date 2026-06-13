import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://localhost:3000";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Align | Read Your Space",
  applicationName: "Align",
  description:
    "Align analyzes your room to reveal how your space may be affecting sleep, focus, and calm — with personalized insights and simple next steps.",
  verification: {
    google: "4ka9w9MjkDqjOnFG53cUzBRQKiuxwAS3WkWBdbmPsnY",
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Align | AI Space Wellness for Sleep, Focus & Calm",
    description:
      "Align analyzes your room to reveal how your space may be affecting sleep, focus, and calm — with personalized insights and simple next steps.",
    url: siteUrl,
    siteName: "Align",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Align | AI Space Wellness for Sleep, Focus & Calm",
    description:
      "Read your space with Align and get personalized next steps for sleep, focus, and calm.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Alignflow",
    alternateName: "Align",
    url: siteUrl,
    email: "hello@alignflow.xyz",
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Align",
    alternateName: "Align",
    url: siteUrl,
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Align",
    alternateName: "Align by Alignflow",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description:
      "AI-powered space wellness for better sleep, focus, and calm through personalized room analysis and next steps.",
    brand: {
      "@type": "Brand",
      name: "Alignflow",
    },
  };

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${outfit.variable} flex min-h-screen flex-col font-sans antialiased selection:bg-primary/20`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
