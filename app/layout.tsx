import type { Metadata } from "next";
import { Poppins, Syne, Space_Grotesk, Instrument_Serif, Space_Mono, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lyricforge.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "LyricForge — AI Song Generator | Describe a Vibe, Get a Song",
    template: "%s | LyricForge",
  },
  description:
    "Describe the vibe, genre, and mood — LyricForge writes original lyrics with AI and renders a fully produced song. No instruments needed, just your imagination.",
  keywords: [
    "AI song generator",
    "AI music generator",
    "AI lyrics writer",
    "create songs with AI",
    "text to song",
    "AI music maker",
    "generate songs online",
    "custom AI songs",
    "LyricForge",
  ],
  authors: [{ name: "LyricForge" }],
  creator: "LyricForge",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "LyricForge",
    title: "LyricForge — Describe a Vibe, Get an Original Song",
    description:
      "AI-powered song creation. Describe your mood, pick a genre, and get a fully produced track with original lyrics in minutes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LyricForge — AI Song Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LyricForge — AI Song Generator",
    description:
      "Describe a vibe. Get original lyrics. Hear your song come alive. No instruments needed.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: APP_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${syne.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable} ${spaceMono.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster theme="dark" position="top-center" richColors offset={60} className="hidden md:block" />
        <Toaster theme="dark" position="bottom-center" richColors className="block md:hidden" />
      </body>
    </html>
  );
}
