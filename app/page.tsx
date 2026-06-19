"use client";

import Link from "next/link";
import { motion } from "motion/react";
import LandingWindow from "@/components/LandingWindow";

export default function Home() {
  return (
    <div className="bg-background w-full min-h-screen px-5 md:px-16 pt-32 pb-16 flex flex-col items-start">
      {/* Glassmorphic navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg shadow-black/20 w-[90%] max-w-md">
        <span className="text-sm font-semibold text-white">Lyric<span className="text-primary">Forge</span></span>
        <Link
          href="/sign-in"
          className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
        >
          Get Started
        </Link>
      </nav>
      <div className="">
        <motion.div
          className="text-7xl md:text-8xl font-extrabold mb-5"
          initial={{ opacity: 0, y: 20, filter: "blur(20px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          Lyric<span className="text-primary">Forge</span>
        </motion.div>
        <motion.div
          className="font-thin text-lg md:text-xl text-[var(--color-text-secondary)]"
          style={{ fontFamily: "var(--font-syne)" }}
          initial={{ opacity: 0, y: 20, filter: "blur(20px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
        >
          Turn a feeling into a finished song. <br />Pick a genre, set the mood, and let AI handle the rest. <br />Your lyrics. Your sound. Ready to play.
        </motion.div>
      </div>
      <motion.div
        className="w-full mt-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
      >
        <LandingWindow />
      </motion.div>
    </div>
  );
}
