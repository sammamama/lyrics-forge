import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { SongStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSongStatus } from "@/lib/suno";
import { refundCredit } from "@/lib/credits";
import { persistSongMedia } from "@/lib/storage";

const IN_FLIGHT: SongStatus[] = [SongStatus.pending, SongStatus.processing];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json(
        { data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    let song = await db.song.findUnique({ where: { id } });
    if (!song || song.userId !== session.user.id) {
      return NextResponse.json(
        { data: null, error: "Song not found" },
        { status: 404 },
      );
    }

    if (IN_FLIGHT.includes(song.status) && song.sunoJobId) {
      try {
        const result = await getSongStatus(song.sunoJobId);
        if (result.status === "done" && result.audioUrl) {
          song = await db.song.update({
            where: { id },
            data: {
              status: SongStatus.done,
              audioUrl: result.audioUrl,
              audioUrl2: result.audioUrl2 ?? null,
              imageUrl: result.imageUrl ?? null,
            },
          });
          const completedSong = song;
          after(() =>
            persistSongMedia(
              completedSong.id,
              completedSong.userId,
              completedSong.audioUrl,
              completedSong.audioUrl2,
              completedSong.imageUrl,
            ),
          );
        } else if (result.status === "failed") {
          const flipped = await db.song.updateMany({
            where: { id, status: { in: IN_FLIGHT } },
            data: { status: SongStatus.failed },
          });
          if (flipped.count === 1) {
            await refundCredit(song.userId);
          }
          song = { ...song, status: SongStatus.failed };
        }
      } catch (err) {
        console.error(`Suno status check failed for song ${id}:`, err);
      }
    }

    return NextResponse.json({
      data: {
        id: song.id,
        title: song.title,
        prompt: song.prompt,
        lyrics: song.lyrics,
        audioUrl: song.audioUrl,
        audioUrl2: song.audioUrl2,
        imageUrl: song.imageUrl,
        status: song.status,
        createdAt: song.createdAt,
      },
      error: null,
    });
  } catch (err) {
    console.error("GET /api/songs/[id] failed:", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
