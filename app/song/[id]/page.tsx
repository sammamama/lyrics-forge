import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SongView } from "@/components/SongView";

export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const song = await db.song.findUnique({ where: { id } });
  if (!song || song.userId !== session.user.id) {
    notFound();
  }

  return (
    <main className="song-page">
      <div className="song-page-header">
        <Link href="/dashboard" className="back-link">
          ← Dashboard
        </Link>
      </div>
      <SongView
        initialSong={{
          id: song.id,
          title: song.title,
          lyrics: song.lyrics,
          audioUrl: song.audioUrl,
          status: song.status,
        }}
      />
    </main>
  );
}
