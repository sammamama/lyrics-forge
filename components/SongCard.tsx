"use client";

import Link from "next/link";
import { Download, Music } from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";

export interface SongCardProps {
  id: string;
  title: string;
  status: "pending" | "processing" | "done" | "failed";
  createdAt: Date | string;
  audioUrl?: string | null;
  audioUrl2?: string | null;
  imageUrl?: string | null;
}

const STATUS_LABEL: Record<SongCardProps["status"], string> = {
  pending: "Queued",
  processing: "Processing",
  done: "Done",
  failed: "Failed",
};

export function SongCard({ id, title, status, createdAt, audioUrl, audioUrl2, imageUrl }: SongCardProps) {
  const date = new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isDone = status === "done";

  return (
    <div className="card song-card">
      {/* Cover art */}
      <Link href={`/song/${id}`} className="song-card-cover" tabIndex={-1} aria-hidden>
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="song-card-image" />
        ) : (
          <div className="song-card-placeholder">
            <Music className="size-10 text-neutral-600" />
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="song-card-body">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/song/${id}`} className="song-card-title-link min-w-0">
            <h3 className="truncate font-medium" style={{ fontSize: "var(--text-h3)" }}>
              {title}
            </h3>
          </Link>
          <span className={`status-pill status-${status} shrink-0`}>
            <span className="status-dot" aria-hidden />
            {STATUS_LABEL[status]}
          </span>
        </div>

        <p
          className="mt-1 text-tertiary"
          suppressHydrationWarning
          style={{ fontSize: "var(--text-caption)" }}
        >
          {date}
        </p>

        {isDone && audioUrl && (
          <div className="song-card-actions">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div>
                <span className="text-tertiary" style={{ fontSize: "var(--text-caption)", fontWeight: 500 }}>V1</span>
                <AudioPlayer src={audioUrl} compact />
              </div>
              {audioUrl2 && (
                <div>
                  <span className="text-tertiary" style={{ fontSize: "var(--text-caption)", fontWeight: 500 }}>V2</span>
                  <AudioPlayer src={audioUrl2} compact />
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <a
                href={audioUrl}
                download
                className="song-card-download"
                aria-label="Download V1"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="size-3.5" />
                V1
              </a>
              {audioUrl2 && (
                <a
                  href={audioUrl2}
                  download
                  className="song-card-download"
                  aria-label="Download V2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="size-3.5" />
                  V2
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
