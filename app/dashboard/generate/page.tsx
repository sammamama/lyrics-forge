"use client";

import { useEffect, useState } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { HistorySidebar } from "@/components/HistorySidebar";
import { LyricsCanvas } from "@/components/LyricsCanvas";
import { PromptBar } from "@/components/PromptBar";
import { StylePanel } from "@/components/StylePanel";

// Three-panel workspace per DESIGN.md: history sidebar (shadcn, 240px) |
// lyrics canvas + prompt bar (centre, fluid) | style panel (320px).
export default function GeneratePage() {
  const [historyOpen, setHistoryOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  // DESIGN.md: below 1280px the history sidebar collapses behind a toggle.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const apply = () => setHistoryOpen(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <SidebarProvider
      open={historyOpen}
      onOpenChange={setHistoryOpen}
      style={{ "--sidebar-width": "240px" } as React.CSSProperties}
    >
      <HistorySidebar />
      <SidebarInset className="workspace-main">
        <div className="workspace-inner">
          <section className="workspace-canvas">
            <SidebarTrigger className="history-trigger" />
            <div className="canvas-scroll">
              <div className="thin-scrollbar m-auto max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-700 bg-transparent p-8 backdrop-blur-xl">
                <LyricsCanvas />
              </div>
            </div>
            <PromptBar />
            <button
              type="button"
              className="style-toggle btn-ghost"
              onClick={() => setSheetOpen(true)}
            >
              Style
            </button>
          </section>

          <aside
            className={`workspace-style${sheetOpen ? " open" : ""}`}
            aria-label="Style controls"
          >
            <button
              type="button"
              className="sheet-close btn-ghost"
              onClick={() => setSheetOpen(false)}
            >
              Done
            </button>
            <StylePanel />
          </aside>
          {sheetOpen && (
            <div
              className="overlay"
              onClick={() => setSheetOpen(false)}
              aria-hidden
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
