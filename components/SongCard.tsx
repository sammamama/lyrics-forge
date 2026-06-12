import Link from "next/link";

export interface SongCardProps {
  id: string;
  title: string;
  status: "pending" | "processing" | "done" | "failed";
  createdAt: Date | string;
}

const STATUS_LABEL: Record<SongCardProps["status"], string> = {
  pending: "Queued",
  processing: "Processing",
  done: "Done",
  failed: "Failed",
};

export function SongCard({ id, title, status, createdAt }: SongCardProps) {
  const date = new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/song/${id}`} className="card song-card">
      <div className="flex items-start justify-between gap-3">
        <h3
          className="truncate font-medium"
          style={{ fontSize: "var(--text-h3)" }}
        >
          {title}
        </h3>
        <span className={`status-pill status-${status}`}>
          <span className="status-dot" aria-hidden />
          {STATUS_LABEL[status]}
        </span>
      </div>
      <p
        className="mt-2 text-tertiary"
        suppressHydrationWarning
        style={{ fontSize: "var(--text-caption)" }}
      >
        {date}
      </p>
    </Link>
  );
}
