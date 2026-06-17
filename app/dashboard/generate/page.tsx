"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, PanelLeft, ChevronRight, Music } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { HistorySidebar } from "@/components/HistorySidebar";
import { LyricsCanvas } from "@/components/LyricsCanvas";
import { PromptBar } from "@/components/PromptBar";
import { StylePanel } from "@/components/StylePanel";
import { useWorkspaceStore } from "@/lib/store";

// Three-panel workspace per DESIGN.md: history sidebar (shadcn, 240px) |
// lyrics canvas + prompt bar (centre, fluid) | style panel (320px).
export default function GeneratePage() {
  const [historyOpen, setHistoryOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const lyrics = useWorkspaceStore((s) => s.lyrics);
  const hasStyle = useWorkspaceStore(
    (s) => s.genres.length > 0 && s.moods.length > 0 && s.themes.length > 0,
  );

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
            <div className="workspace-topbar">
              <Link href="/dashboard" aria-label="Dashboard" className="inline-flex items-center justify-center size-8 rounded-md hover:bg-elevated">
                <Home className="md:block hidden" size={18} />
              </Link>
              <SidebarTrigger className="inline-flex items-center justify-center size-8 rounded-md hover:bg-elevated">
                <PanelLeft size={18} />
              </SidebarTrigger>
            </div>
            <div className="canvas-scroll">
              <div className="thin-scrollbar m-auto max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-700 bg-transparent p-8 backdrop-blur-xl">
                <LyricsCanvas />
              </div>
            </div>
            {lyrics && !sheetOpen && (
              <button
                type="button"
                className="mobile-style-cta mt-5"
                onClick={() => setSheetOpen(true)}
              >
                Generate
              </button>
            )}
            <PromptBar />
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
