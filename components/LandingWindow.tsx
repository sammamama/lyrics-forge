"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValueEvent } from "motion/react";
import { toast } from "sonner";
import LandingPlayer from "@/components/LandingPlayer";

export default function LandingWindow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Step 1: prompt text (0–0.25), stays visible after
  const promptOpacity = useTransform(scrollYProgress, [0, 0.25, 1], [0, 1, 1]);
  const promptY = useTransform(scrollYProgress, [0, 0.25, 1], [20, 0, 0]);
  const promptBlur = useTransform(scrollYProgress, [0, 0.25, 1], [20, 0, 0]);
  const promptFilter = useMotionTemplate`blur(${promptBlur}px)`;

  // Step 2: send button processing (0.25–0.4), arrow returns after lyrics done
  const processingOpacity = useTransform(scrollYProgress, [0.25, 0.35, 0.65, 0.7], [0, 1, 1, 0]);
  const arrowOpacity = useTransform(scrollYProgress, [0.25, 0.35, 0.65, 0.7], [1, 0, 0, 1]);

  // Step 3: lyrics (0.4–0.7), stays visible after
  const lyricsOpacity = useTransform(scrollYProgress, [0.4, 0.7, 1], [0, 1, 1]);
  const lyricsY = useTransform(scrollYProgress, [0.4, 0.7, 1], [20, 0, 0]);
  const lyricsBlur = useTransform(scrollYProgress, [0.4, 0.7, 1], [20, 0, 0]);
  const lyricsFilter = useMotionTemplate`blur(${lyricsBlur}px)`;

  // Step 4: song player (0.7–1.0), stays visible after
  const playerOpacity = useTransform(scrollYProgress, [0.7, 1.0, 1], [0, 1, 1]);
  const playerY = useTransform(scrollYProgress, [0.7, 1.0, 1], [20, 0, 0]);

  // Scroll-triggered toasts (forward and reverse)
  const prevProgress = useRef(0);
  const activeStep = useRef(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const scrollingDown = v > prevProgress.current;
    prevProgress.current = v;

    let step = 0;
    if (v >= 0.75) step = 3;
    else if (v >= 0.4) step = 2;
    else if (v >= 0.12) step = 1;

    if (step !== activeStep.current) {
      activeStep.current = step;
      toast.dismiss();
      const showToast = [
        () => toast("Describe your song"),
        () => toast.info("Get the lyrics"),
        () => toast.success("Get the song"),
      ];
      if (step > 0) showToast[step - 1]();
    }
  });

  const lyrics = `When the night falls slow
And the room feels cold
And your name is the echo in me
No, I won't deny
Oh, I won't deny
How it hurts that you won't stay with me

So darling, darling
Don't you leave me, don't leave me
Oh don't go, don't leave me
Don't leave me

If the dreams that we built before
All shatter and fade
And the truth comes crashing through me
I won't scream, I won't scream
No, I won't beg you here
Even though you won't stay, stay with me

And darling, darling
Don't you leave me, don't leave me
Oh don't go now, don't leave me
Don't leave me`;

  const promptBar = (
    <div className="relative mx-auto w-[90%] h-8 md:h-10 bg-neutral-700 rounded-xl flex-shrink-0">
      <motion.div
        className="flex w-full h-full px-3 md:px-5 text-xs md:text-sm justify-start font-thin items-center"
        style={{ opacity: promptOpacity, y: promptY, filter: promptFilter }}
      >
        Write a heartbreak song...
      </motion.div>
      <div className="absolute flex justify-center items-center right-2 md:right-3 w-6 md:w-7 h-6 md:h-7 top-1/2 -translate-y-1/2 bg-[var(--golden)] rounded-full">
        <motion.svg
          className="text-black absolute"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden
          style={{ opacity: arrowOpacity }}
        >
          <path d="M8 14a.75.75 0 0 1-.75-.75V4.56L4.03 7.78a.75.75 0 0 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 1 1-1.06 1.06L8.75 4.56v8.69A.75.75 0 0 1 8 14z" />
        </motion.svg>
        <motion.div
          className="absolute w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"
          style={{ opacity: processingOpacity }}
        />
      </div>
    </div>
  );

  const lyricsBlock = (
    <motion.div
      className="text-xs md:text-sm p-3 md:p-5 pt-1 md:pt-2 font-thin whitespace-pre-line leading-relaxed"
      style={{ opacity: lyricsOpacity, y: lyricsY, filter: lyricsFilter }}
    >
      {lyrics}
    </motion.div>
  );

  const playerBlock = (
    <motion.div
      className="flex justify-center py-2 md:py-4"
      style={{ opacity: playerOpacity, y: playerY }}
    >
      <LandingPlayer />
    </motion.div>
  );

  return (
    <div ref={containerRef} className="relative h-[300vh] p-3">
      <div className="sticky top-[10vh]">
        <div className="relative w-[90%] md:w-[80%] mx-auto border border-neutral-700 bg-neutral-800 rounded-xl overflow-hidden">
          {/* Golden glow from bottom center */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-40 bg-[var(--golden)] opacity-25 blur-3xl rounded-full pointer-events-none" />

          {/* Window chrome */}
          <div className="flex flex-row gap-1.5 md:gap-2 w-full p-2.5 md:p-5">
            <div className="bg-green-500 w-3 h-3 rounded-full"></div>
            <div className="bg-yellow-500 w-3 h-3 rounded-full"></div>
            <div className="bg-red-500 w-3 h-3 rounded-full"></div>
          </div>

          {/* Desktop: two-panel layout */}
          <div className="hidden md:flex flex-row border-t border-neutral-600 h-[80vh]">
            {/* Left panel */}
            <div className="relative w-[30%] border-r border-neutral-600">
              <div className="text-lg p-2 font-bold">
                <span style={{ fontFamily: "var(--font-space-grotesk)" }}>Lyric</span><span className="text-primary font-normal italic" style={{ fontFamily: "var(--font-instrument-serif)" }}>Forge</span>
              </div>
              {lyricsBlock}
              <div className="absolute bottom-0 left-0 w-full pb-3">
                {promptBar}
              </div>
            </div>
            {/* Right panel */}
            <div className="w-full bg-neutral-900 p-5 flex flex-col">
              <div className="font-bold text-2xl">Your Songs</div>
              <div className="flex-1 flex items-center justify-center">
                {playerBlock}
              </div>
            </div>
          </div>

          {/* Mobile: single-column layout */}
          <div className="flex md:hidden flex-col border-t border-neutral-600">
            <div className="text-sm p-2 font-bold">
              <span style={{ fontFamily: "var(--font-space-grotesk)" }}>Lyric</span><span className="text-primary font-normal italic" style={{ fontFamily: "var(--font-instrument-serif)" }}>Forge</span>
            </div>
            {promptBar}
            {lyricsBlock}
            <div className="border-t border-neutral-600">
              {playerBlock}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
