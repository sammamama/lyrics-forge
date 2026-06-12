import { NextResponse } from "next/server";

// sunoapi.org requires a callBackUrl on every generate request and marks the
// task CALLBACK_EXCEPTION if the callback fails. Song status flows through
// polling (GET /api/songs/[id]), so this route only acknowledges the callback.
export async function POST() {
  return NextResponse.json({ data: { received: true }, error: null });
}
