import { NextRequest, NextResponse } from "next/server";
import { SongStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { refundCredit } from "@/lib/credits";

// sunoapi.org POSTs the completed task payload here.
// In production this fires immediately when Suno finishes — no poll lag.
// In local dev Suno can't reach localhost, so polling is the fallback.

interface SunoTrackPayload {
  audioUrl?: string | null;
  streamAudioUrl?: string | null;
  imageUrl?: string | null;
}

interface SunoWebhookPayload {
  taskId?: string;
  status?: string;
  response?: { sunoData?: SunoTrackPayload[] | null } | null;
  // sunoapi.org may also wrap in { code, data }
  code?: number;
  data?: {
    taskId?: string;
    status?: string;
    response?: { sunoData?: SunoTrackPayload[] | null } | null;
  };
}

const IN_FLIGHT: SongStatus[] = [SongStatus.pending, SongStatus.processing];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SunoWebhookPayload;

    // Handle both envelope { code, data } and direct payload shapes.
    const payload = body.data ?? body;
    const taskId = payload.taskId;
    const status = payload.status;
    const tracks = payload.response?.sunoData ?? [];

    if (!taskId) {
      return NextResponse.json({ data: { received: true }, error: null });
    }

    console.log("[suno webhook] taskId:", taskId, "status:", status, "tracks:", tracks.length);

    const audioUrl = tracks.find((t) => t.audioUrl)?.audioUrl ?? null;
    const audioUrl2 = tracks.filter((t) => t.audioUrl)[1]?.audioUrl ?? null;
    const imageUrl = tracks[0]?.imageUrl ?? null;

    if ((status === "SUCCESS" || (status === "CALLBACK_EXCEPTION" && audioUrl)) && audioUrl) {
      await db.song.updateMany({
        where: { sunoJobId: taskId, status: { in: IN_FLIGHT } },
        data: { status: SongStatus.done, audioUrl, audioUrl2, imageUrl },
      });
      console.log("[suno webhook] marked done:", taskId);
    } else if (
      status === "CREATE_TASK_FAILED" ||
      status === "GENERATE_AUDIO_FAILED" ||
      status === "SENSITIVE_WORD_ERROR" ||
      (status === "CALLBACK_EXCEPTION" && !audioUrl)
    ) {
      const song = await db.song.findFirst({ where: { sunoJobId: taskId } });
      if (song) {
        const flipped = await db.song.updateMany({
          where: { sunoJobId: taskId, status: { in: IN_FLIGHT } },
          data: { status: SongStatus.failed },
        });
        if (flipped.count === 1) {
          await refundCredit(song.userId);
        }
        console.log("[suno webhook] marked failed:", taskId);
      }
    }

    return NextResponse.json({ data: { received: true }, error: null });
  } catch (err) {
    console.error("[suno webhook] error:", err);
    // Always return 200 so sunoapi.org doesn't retry endlessly.
    return NextResponse.json({ data: { received: true }, error: null });
  }
}
