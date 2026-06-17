import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { SongStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSongStatus } from "@/lib/suno";
import { refundCredit } from "@/lib/credits";
import { persistSongMedia } from "@/lib/storage";

const IN_FLIGHT: SongStatus[] = [SongStatus.pending, SongStatus.processing];

// Lightweight song list for the history sidebar.
// Also resolves any in-flight songs against Suno so stuck songs get unstuck.
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json(
        { data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const songs = await db.song.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, title: true, status: true, audioUrl: true, audioUrl2: true, imageUrl: true, lyrics: true, createdAt: true, sunoJobId: true, userId: true },
    });

    const stale = songs.filter((s) => IN_FLIGHT.includes(s.status) && s.sunoJobId);
    const completed: typeof songs = [];

    await Promise.allSettled(
      stale.map(async (song) => {
        try {
          const result = await getSongStatus(song.sunoJobId!);
          if (result.status === "done" && result.audioUrl) {
            await db.song.update({
              where: { id: song.id },
              data: {
                status: SongStatus.done,
                audioUrl: result.audioUrl,
                audioUrl2: result.audioUrl2 ?? null,
                imageUrl: result.imageUrl ?? null,
              },
            });
            song.status = SongStatus.done;
            song.audioUrl = result.audioUrl;
            song.audioUrl2 = result.audioUrl2 ?? null;
            song.imageUrl = result.imageUrl ?? null;
            completed.push(song);
          } else if (result.status === "failed") {
            const flipped = await db.song.updateMany({
              where: { id: song.id, status: { in: IN_FLIGHT } },
              data: { status: SongStatus.failed },
            });
            if (flipped.count === 1) await refundCredit(song.userId);
            song.status = SongStatus.failed;
          }
        } catch (err) {
          console.error(`Suno check failed for song ${song.id}:`, err);
        }
      }),
    );

    if (completed.length > 0) {
      after(() =>
        Promise.allSettled(
          completed.map((s) =>
            persistSongMedia(s.id, s.userId, s.audioUrl, s.audioUrl2, s.imageUrl),
          ),
        ),
      );
    }

    return NextResponse.json({
      data: {
        songs: songs.map(({ sunoJobId, userId, ...rest }) => rest),
      },
      error: null,
    });
  } catch (err) {
    console.error("GET /api/songs failed:", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
