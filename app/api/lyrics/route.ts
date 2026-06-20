import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  generateLyrics,
  reviseLyrics,
  InvalidLyricsInputError,
} from "@/lib/claude";
import { checkLyricsRateLimit } from "@/lib/rate-limit";
import type { LyricsInput } from "@/types";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
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

    const limit = await checkLyricsRateLimit(userId);
    if (!limit.ok) {
      return NextResponse.json(
        { data: null, error: "Too many lyrics requests — slow down" },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds ?? 60) },
        },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { data: null, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    try {
      const currentLyrics =
        typeof body.currentLyrics === "string" ? body.currentLyrics : "";

      // Revision mode: existing lyrics + an instruction ("make the chorus sadder").
      if (currentLyrics.trim()) {
        const instruction =
          typeof body.instruction === "string" ? body.instruction : "";
        const result = await reviseLyrics(currentLyrics, instruction);
        return NextResponse.json({ data: result, error: null });
      }

      const input: LyricsInput = {
        description:
          typeof body.description === "string" ? body.description : "",
        genres: toStringArray(body.genres),
        moods: toStringArray(body.moods),
        themes: toStringArray(body.themes),
        tempo: typeof body.tempo === "string" ? body.tempo : "",
        structure: Array.isArray(body.structure)
          ? toStringArray(body.structure)
          : undefined,
      };
      const result = await generateLyrics(input);
      return NextResponse.json({ data: result, error: null });
    } catch (err) {
      if (err instanceof InvalidLyricsInputError) {
        return NextResponse.json(
          { data: null, error: err.message },
          { status: 400 },
        );
      }
      throw err;
    }
  } catch (err) {
    console.error("POST /api/lyrics failed:", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
