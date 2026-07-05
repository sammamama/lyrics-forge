"use client";

import Link from "next/link";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { motion, useMotionTemplate, useMotionValue, useSpring, animate } from "motion/react";
import { useEffect, useRef } from "react";
import LandingWindow from "@/components/LandingWindow";
import MarqueeBackground from "@/components/MarqueeBackground";

const COLORS = ["#fca311", "#e29210", "#d4860a", "#c47a08", "#fca311"];

export default function Home() {
  const color = useMotionValue(COLORS[0]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    animate(color, COLORS, {
      ease: "easeInOut",
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, [color]);

  const backgroundImage = useMotionTemplate`
    radial-gradient(125% 125% at 50% 0%, #020617 50%, ${color})
  `;

  const btnRef = useRef<HTMLAnchorElement>(null);
  const btnX = useSpring(0, { stiffness: 150, damping: 15 });
  const btnY = useSpring(0, { stiffness: 150, damping: 15 });

  const handleBtnMouseMove = (e: React.MouseEvent) => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    btnX.set((e.clientX - cx) * 0.3);
    btnY.set((e.clientY - cy) * 0.3);
  };

  const handleBtnMouseLeave = () => {
    btnX.set(0);
    btnY.set(0);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "LyricForge",
    url: "https://lyricforge.xyz",
    description:
      "AI-powered song generator. Describe the vibe, genre, and mood — get original lyrics and a fully produced song.",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "3.99",
      priceCurrency: "USD",
      description: "Credit packs starting at $3.99 for 5 songs",
    },
  };

  return (
    <div className="bg-background w-full min-h-screen px-5 md:px-16 pt-32 pb-0 flex flex-col items-start">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Glassmorphic navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg shadow-black/20 w-[90%] max-w-md">
        <span className="text-sm font-semibold text-white"><span style={{ fontFamily: "var(--font-space-grotesk)" }}>Lyric</span><span className="text-primary font-normal italic" style={{ fontFamily: "var(--font-instrument-serif)" }}>Forge</span></span>
        <Link
          href="/dashboard"
          className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
        >
          Get Started
        </Link>
      </nav>
      <div className="relative w-full">
        <MarqueeBackground />

        <div className="relative z-10">
          <motion.div
            className="text-7xl md:text-8xl font-extrabold mb-5"
            initial={{ opacity: 0, y: 20, filter: "blur(20px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span style={{ fontFamily: "var(--font-space-grotesk)" }}>Lyric</span><span className="text-primary font-normal italic" style={{ fontFamily: "var(--font-instrument-serif)" }}>Forge</span>
          </motion.div>
          <motion.p
            className="text-lg md:text-3xl italic text-white/80"
            style={{ fontFamily: "var(--font-instrument-serif)" }}
            initial={{ opacity: 0, y: 20, filter: "blur(20px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          >
            Describe a vibe. Get original lyrics. <br />
            Hit generate and hear your song come alive. <br />
            No instruments needed — just your imagination.
          </motion.p>
        </div>

        <motion.div
          className="w-full mt-16 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
        >
          <LandingWindow />
        </motion.div>
      </div>

      {/* Arch gradient CTA */}
      <motion.section
        className="relative w-[calc(100%+2.5rem)] md:w-[calc(100%+8rem)] -mx-5 md:-mx-16 rounded-t-[80px] md:rounded-t-[120px] py-32 md:py-44 flex flex-col items-center justify-center text-center gap-6 overflow-hidden"
        style={{ backgroundImage }}
      >
        <h2 className="text-4xl md:text-6xl italic" style={{ fontFamily: "var(--font-instrument-serif)" }}>
          Start Creating Your<br />Music Journey
        </h2>
        <p className="text-sm md:text-base text-[var(--color-text-secondary)] max-w-md font-thin leading-tight" style={{ fontFamily: "var(--font-space-mono)" }}>
          From idea to finished track in minutes. No instruments needed.
        </p>
        <motion.a
          ref={btnRef}
          href="/dashboard"
          className="mt-4 px-8 py-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-xl text-white font-semibold text-sm shadow-lg shadow-black/20 hover:bg-white/20 transition-colors cursor-pointer"
          style={{ x: btnX, y: btnY }}
          onMouseMove={handleBtnMouseMove}
          onMouseLeave={handleBtnMouseLeave}
        >
          Get Started
        </motion.a>
      </motion.section>
    </div>
  );
}
