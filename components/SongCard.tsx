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
  imageUrl?: string | null;
}

const STATUS_LABEL: Record<SongCardProps["status"], string> = {
  pending: "Queued",
  processing: "Processing",
  done: "Done",
  failed: "Failed",
};

export function SongCard({ id, title, status, createdAt, audioUrl, imageUrl }: SongCardProps) {
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
            <AudioPlayer src={audioUrl} compact />
            <a
              href={audioUrl}
              download
              className="song-card-download"
              aria-label="Download song"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="size-3.5" />
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
