"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { CreditsBadge } from "@/components/CreditsBadge";
import { UserButton } from "@/components/UserButton";
import { useWorkspaceStore } from "@/lib/store";

interface SongItem {
  id: string;
  title: string;
  status: "pending" | "processing" | "done" | "failed";
}

export function HistorySidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [songs, setSongs] = useState<SongItem[] | null>(null);
  const reset = useWorkspaceStore((s) => s.reset);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/songs")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && Array.isArray(json?.data?.songs)) {
          setSongs(json.data.songs);
        }
      })
      .catch(() => {
        if (!cancelled) setSongs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Sidebar className="w-[20%]" collapsible="offcanvas">
      <SidebarHeader className="gap-4 px-4 pt-5">
        <Link href="/dashboard" className="dash-logo">
          Lyric<span className="text-primary">Forge</span>
        </Link>
        <UserButton>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              reset();
              onNavigate?.();
            }}
          >
            + New song
          </Button>
        </UserButton>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarMenu>
            {songs === null ? (
              Array.from({ length: 4 }, (_, i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuSkeleton />
                </SidebarMenuItem>
              ))
            ) : songs.length === 0 ? (
              <p className="px-2 py-3 text-tertiary" style={{ fontSize: "var(--text-label)" }}>
                No songs yet
              </p>
            ) : (
              songs.map((song) => (
                <SidebarMenuItem key={song.id}>
                  <SidebarMenuButton asChild title={song.title}>
                    <Link href={`/song/${song.id}`} onClick={onNavigate}>
                      <span
                        className={`status-dot status-${song.status}`}
                        aria-hidden
                      />
                      <span className="truncate">{song.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 pb-5">
        <div>
          <CreditsBadge />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
