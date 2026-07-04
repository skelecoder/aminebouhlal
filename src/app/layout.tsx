import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { site } from "@/data/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Solutions Architect · Agentic AI & Digital Transformation`,
    template: `%s — ${site.name}`,
  },
  description:
    "Solutions architect in Tangier, Morocco — agentic AI, cloud platforms and enterprise integration. 8+ years delivering production systems across Europe, Africa and North America, including a voice agent handling 180,000+ calls a month.",
  keywords: [
    "Amine Bouhlal",
    "solutions architect",
    "agentic AI",
    "digital transformation",
    "voice AI",
    "conversational AI",
    "GCP",
    "Vertex AI",
    "Gemini Enterprise",
    "Morocco",
    "Tangier",
  ],
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — Solutions Architect`,
    description:
      "I turn business problems into systems that ship. Agentic AI, cloud platforms, enterprise integration — hands-on from discovery to production.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Solutions Architect`,
    description:
      "I turn business problems into systems that ship. Agentic AI, cloud platforms, enterprise integration.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
