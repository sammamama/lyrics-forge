import type {
  CreateSongInput,
  SongStatus,
  SongStatusResult,
  StyleInput,
} from "@/types";

// Fetch wrapper for the sunoapi.org API (https://docs.sunoapi.org).
// Every response is an envelope { code, msg, data } — the HTTP status can be
// 200 even when the request failed, so `code` must be checked too.

const SUNO_MODEL = "V4_5";

export class SunoApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SunoApiError";
  }
}

function baseUrl(): string {
  const url = process.env.SUNO_API_BASE_URL;
  if (!url) throw new Error("SUNO_API_BASE_URL is not set");
  return url.replace(/\/+$/, "");
}

interface SunoEnvelope<T> {
  code: number;
  msg: string;
  data: T | null;
}

async function sunoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = process.env.SUNO_API_KEY;
  if (!apiKey) throw new Error("SUNO_API_KEY is not set");

  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new SunoApiError(
      `Suno API ${res.status} on ${path}: ${body.slice(0, 500)}`,
      res.status,
    );
  }
  const envelope = (await res.json()) as SunoEnvelope<T>;
  if (envelope.code !== 200 || envelope.data == null) {
    throw new SunoApiError(
      `Suno API error ${envelope.code} on ${path}: ${envelope.msg}`,
      envelope.code,
    );
  }
  return envelope.data;
}

/**
 * Derive a Suno style string from the user's style inputs,
 * e.g. "melancholic indie rock, slow tempo, female vocals".
 * Users never supply a raw style string.
 */
export function buildStylePrompt(input: StyleInput): string {
  const parts: string[] = [];
  const genreMood = [...input.moods, ...input.genres].join(" ").trim();
  if (genreMood) parts.push(genreMood);
  if (input.tempo) {
    parts.push(
      input.tempo.toLowerCase().includes("tempo")
        ? input.tempo
        : `${input.tempo} tempo`,
    );
  }
  if (input.vocals) parts.push(`${input.vocals} vocals`);
  return parts.join(", ");
}

/** Map sunoapi.org task status values onto our SongStatus. */
function mapStatus(raw: string, hasAudio: boolean): SongStatus {
  switch (raw) {
    case "PENDING":
      return "pending";
    case "TEXT_SUCCESS":
    case "FIRST_SUCCESS":
      return "processing";
    case "SUCCESS":
    case "CALLBACK_EXCEPTION":
      return hasAudio ? "done" : "failed";
    case "CREATE_TASK_FAILED":
    case "GENERATE_AUDIO_FAILED":
    case "SENSITIVE_WORD_ERROR":
      return "failed";
    default:
      return "processing";
  }
}

interface SunoCreateData {
  taskId: string;
}

interface SunoTrack {
  audioUrl?: string | null;
  streamAudioUrl?: string | null;
  imageUrl?: string | null;
}

interface SunoTaskDetails {
  status: string;
  response?: { sunoData?: SunoTrack[] | null } | null;
  errorMessage?: string | null;
}

/** Submit lyrics + style to Suno for rendering. Returns the Suno task id. */
export async function createSong(
  input: CreateSongInput,
): Promise<{ jobId: string }> {
  const data = await sunoFetch<SunoCreateData>("/api/v1/generate", {
    method: "POST",
    body: JSON.stringify({
      customMode: true,
      instrumental: false,
      model: SUNO_MODEL,
      prompt: input.lyrics,
      style: input.stylePrompt,
      title: input.title.slice(0, 80),
      callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/songs/callback`,
    }),
  });
  if (!data.taskId) {
    throw new SunoApiError("Suno create response missing taskId");
  }
  return { jobId: data.taskId };
}

/** Check a Suno task. audioUrl is set once the track is ready. */
export async function getSongStatus(
  jobId: string,
): Promise<SongStatusResult> {
  const data = await sunoFetch<SunoTaskDetails>(
    `/api/v1/generate/record-info?taskId=${encodeURIComponent(jobId)}`,
  );
  console.log("[suno] raw response:", JSON.stringify(data, null, 2));
  const tracks = data.response?.sunoData ?? [];
  const withAudio = tracks.filter((t) => t.audioUrl);
  const audioUrl = withAudio[0]?.audioUrl ?? undefined;
  const audioUrl2 = withAudio[1]?.audioUrl ?? undefined;
  const imageUrl = tracks[0]?.imageUrl ?? undefined;
  const status = mapStatus(data.status, Boolean(audioUrl));
  console.log("[suno] mapped →", status, "| v1:", audioUrl, "| v2:", audioUrl2, "| img:", imageUrl);
  return {
    status,
    audioUrl: status === "done" ? audioUrl : undefined,
    audioUrl2: status === "done" ? audioUrl2 : undefined,
    imageUrl: status === "done" ? imageUrl : undefined,
  };
}
