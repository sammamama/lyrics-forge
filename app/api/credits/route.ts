import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBalance } from "@/lib/credits";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json(
        { data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const balance = await getBalance(session.user.id);
    return NextResponse.json({ data: { balance }, error: null });
  } catch (err) {
    console.error("GET /api/credits failed:", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
