"use client";

import { motion } from "motion/react";

interface MarqueeCardData {
  image: string;
  song: string;
  artist: string;
}

const COLUMNS: { duration: string; cards: MarqueeCardData[] }[] = [
  {
    duration: "25s",
    cards: [
      { image: "/marquee/marquee-1.jpg", song: "Midnight Drive", artist: "Nova Eclipse" },
      { image: "/marquee/marquee-5.jpg", song: "Neon Pulse", artist: "Glass Tide" },
      { image: "/marquee/marquee-9.jpg", song: "Golden Hour", artist: "Amber Waves" },
    ],
  },
  {
    duration: "35s",
    cards: [
      { image: "/marquee/marquee-2.jpg", song: "Velvet Skies", artist: "Luna Park" },
      { image: "/marquee/marquee-6.jpg", song: "After Rain", artist: "Drift Theory" },
      { image: "/marquee/marquee-10.jpg", song: "Lost Signal", artist: "Echo Chamber" },
    ],
  },
  {
    duration: "20s",
    cards: [
      { image: "/marquee/marquee-3.jpg", song: "Slow Burn", artist: "Pale Morning" },
      { image: "/marquee/marquee-7.jpg", song: "Paper Moons", artist: "Silver Lining" },
      { image: "/marquee/marquee-11.jpg", song: "Still Waters", artist: "Deep Current" },
    ],
  },
  {
    duration: "30s",
    cards: [
      { image: "/marquee/marquee-4.jpg", song: "Fading Light", artist: "Sunset Ritual" },
      { image: "/marquee/marquee-8.jpg", song: "Ocean Floor", artist: "Coral Drift" },
    ],
  },
];

function MarqueeCard({ image, song, artist }: MarqueeCardData) {
  return (
    <div className="w-[250px] md:w-[500px] flex-shrink-0">
      <div className="aspect-square rounded-lg overflow-hidden bg-neutral-800">
        <img
          src={image}
          alt=""
          className="w-full h-full object-cover"
          decoding="async"
        />
      </div>
      <div className="mt-1.5 px-0.5">
        <p className="text-[10px] md:text-xs font-medium text-white/80 truncate">
          {song}
        </p>
        <p className="text-[9px] md:text-[10px] text-white/40 truncate">
          {artist}
        </p>
      </div>
    </div>
  );
}

export default function MarqueeBackground() {
  return (
    <motion.div
      className="absolute top-0 bottom-0 -left-5 -right-5 md:-left-16 md:-right-16 overflow-hidden pointer-events-none z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
    >
      <div
        className="flex justify-around items-start w-full h-full"
        style={{
          maskImage:
            "radial-gradient(ellipse 100% 45% at 50% 50%, black 40%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 100% 45% at 50% 50%, black 40%, transparent 75%)",
        }}
      >
        {COLUMNS.map((col, i) => (
          <div key={i} className="overflow-hidden h-full">
            <div
              className="marquee-track flex flex-col gap-8 md:gap-12"
              style={{ "--marquee-duration": col.duration } as React.CSSProperties}
            >
              {[...col.cards, ...col.cards].map((card, j) => (
                <MarqueeCard key={j} {...card} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-black/60" />
    </motion.div>
  );
}
