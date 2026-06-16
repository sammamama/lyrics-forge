import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Lightweight song list for the history sidebar.
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
      select: { id: true, title: true, status: true, audioUrl: true, audioUrl2: true, lyrics: true, createdAt: true },
    });

    return NextResponse.json({ data: { songs }, error: null });
  } catch (err) {
    console.error("GET /api/songs failed:", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
