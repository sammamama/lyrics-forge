"use client";

import { Button } from "./button";

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Chip({ active = false, onClick, children }: ChipProps) {
  return (
    <Button
      type="button"
      className={` gap-2 p-2 rounded-lg text-sm font-light bg-transparent text-neutral-300 
        hover:bg-neutral-50/90 hover:text-neutral-800 ${active ? "bg-neutral-50/90 text-neutral-800" : ""} tracking-tight`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
