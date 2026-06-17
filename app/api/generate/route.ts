import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  generateLyrics,
  validateLyricsInput,
  InvalidLyricsInputError,
} from "@/lib/claude";
import { buildStylePrompt, createSong, SunoApiError } from "@/lib/suno";
import {
  refundCredit,
  InsufficientCreditsError,
} from "@/lib/credits";
import type { LyricsInput } from "@/types";

// Caps for client-supplied lyrics (canvas-edited, phase 1 output).
// Suno's V4_5 model caps the lyrics prompt at 5000 chars.
const MAX_LYRICS_LENGTH = 5_000;
const MAX_TITLE_LENGTH = 100;

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json(
        { data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const userId = session.user.id;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { data: null, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const input: LyricsInput = {
      description: typeof body.description === "string" ? body.description : "",
      genres: toStringArray(body.genres),
      moods: toStringArray(body.moods),
      themes: toStringArray(body.themes),
      tempo: typeof body.tempo === "string" ? body.tempo : "",
      structure: Array.isArray(body.structure)
        ? toStringArray(body.structure)
        : undefined,
    };

    try {
      validateLyricsInput(input);
    } catch (err) {
      if (err instanceof InvalidLyricsInputError) {
        return NextResponse.json(
          { data: null, error: err.message },
          { status: 400 },
        );
      }
      throw err;
    }

    const providedLyrics = optionalString(body.lyrics);
    if (providedLyrics && providedLyrics.length > MAX_LYRICS_LENGTH) {
      return NextResponse.json(
        { data: null, error: `lyrics exceeds ${MAX_LYRICS_LENGTH} characters` },
        { status: 400 },
      );
    }
    const providedTitle = optionalString(body.title);
    if (providedTitle && providedTitle.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        { data: null, error: `title exceeds ${MAX_TITLE_LENGTH} characters` },
        { status: 400 },
      );
    }

    // Canvas-edited lyrics pass straight through; otherwise generate now.
    let lyrics: string;
    let title: string;
    if (providedLyrics) {
      lyrics = providedLyrics;
      title = providedTitle ?? "Untitled";
    } else {
      ({ title, lyrics } = await generateLyrics(input));
    }

    const stylePrompt = buildStylePrompt({
      genres: input.genres,
      moods: input.moods,
      tempo: input.tempo,
      vocals: optionalString(body.vocals),
    });

    // Deduct credit and create song row in a single transaction so
    // concurrent requests cannot double-spend. Suno call happens after
    // the credit is reserved — refund if Suno fails.
    let songId: string;
    try {
      const result = await db.$transaction(async (tx) => {
        const updated = await tx.credits.updateMany({
          where: { userId, balance: { gte: 1 } },
          data: { balance: { decrement: 1 } },
        });
        if (updated.count === 0) {
          throw new InsufficientCreditsError(userId);
        }

        const song = await tx.song.create({
          data: {
            userId,
            title,
            prompt: input.description,
            lyrics,
            status: "pending",
          },
        });
        return song;
      });
      songId = result.id;
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        return NextResponse.json(
          { data: null, error: "Insufficient credits" },
          { status: 402 },
        );
      }
      throw err;
    }

    let jobId: string;
    try {
      ({ jobId } = await createSong({ lyrics, stylePrompt, title }));
    } catch (err) {
      // Suno failed — refund credit and mark song failed.
      await Promise.all([
        refundCredit(userId).catch(() => {}),
        db.song.update({
          where: { id: songId },
          data: { status: "failed" },
        }).catch(() => {}),
      ]);
      if (err instanceof SunoApiError) {
        console.error("Suno createSong failed:", err);
        return NextResponse.json(
          { data: null, error: "Music generation service unavailable" },
          { status: 502 },
        );
      }
      throw err;
    }

    await db.song.update({
      where: { id: songId },
      data: { sunoJobId: jobId, status: "processing" },
    });

    return NextResponse.json({
      data: { songId, sunoJobId: jobId },
      error: null,
    });
  } catch (err) {
    console.error("POST /api/generate failed:", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
