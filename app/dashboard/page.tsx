import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SongCard } from "@/components/SongCard";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const songs = await db.song.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, status: true, createdAt: true, audioUrl: true, audioUrl2: true, imageUrl: true },
  });

  return (
    <div className="dash-page">
      <h1 className="font-semibold" style={{ fontSize: "var(--text-h1)" }}>
        Your songs
      </h1>

      {songs.length === 0 ? (
        <div className="card empty-state">
          <p
            className="text-muted-foreground"
            style={{ fontSize: "var(--text-body-lg)" }}
          >
            Nothing here yet. Describe a vibe and get your first track.
          </p>
          <Link href="/dashboard/generate" className="btn-primary inline-block">
            Generate a song
          </Link>
        </div>
      ) : (
        <div className="song-grid">
          {songs.map((song) => (
            <SongCard key={song.id} {...song} />
          ))}
        </div>
      )}
    </div>
  );
}
