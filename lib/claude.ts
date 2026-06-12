import Anthropic from "@anthropic-ai/sdk";
import type { LyricsInput, LyricsResult } from "@/types";

// All lyrics prompt text lives in this file — don't inline prompts in route handlers.

const MODEL = "claude-sonnet-4-6";

const DEFAULT_STRUCTURE = [
  "Verse 1",
  "Chorus",
  "Verse 2",
  "Chorus",
  "Bridge",
  "Chorus",
];

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const SYSTEM_PROMPT = `You are a professional songwriter writing for an AI music generation service.

Rules:
- Write fully original lyrics. Never reference, quote, interpolate, or imitate existing songs, artists, albums, or recognizable lyrics.
- Output lyrics in Suno-compatible format: each section starts with a tag on its own line, like [Verse 1], [Chorus], [Bridge], [Outro].
- Follow the requested section structure exactly, in order.
- Keep lines singable: natural stress patterns, consistent meter within a section.
- The chorus should repeat with identical (or near-identical) lyrics each time it appears.
- Give the song a short, original title (2–6 words) that does not name any existing work.`;

const SUBMIT_LYRICS_TOOL: Anthropic.Tool = {
  name: "submit_lyrics",
  description:
    "Submit the finished song. Call this exactly once with the complete lyrics and title.",
  input_schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Original song title, 2-6 words.",
      },
      lyrics: {
        type: "string",
        description:
          "Complete lyrics. Each section preceded by its tag on its own line, e.g. [Verse 1], [Chorus], [Bridge]. No commentary outside the lyrics.",
      },
    },
    required: ["title", "lyrics"],
  },
};

// Server-side input caps — bound worst-case Claude token spend per call.
const INPUT_LIMITS = {
  description: 1000,
  listItems: 10,
  listItemLength: 50,
  structureSections: 12,
} as const;

export class InvalidLyricsInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidLyricsInputError";
  }
}

export function validateLyricsInput(input: LyricsInput): void {
  if (!input.description?.trim()) {
    throw new InvalidLyricsInputError("description is required");
  }
  if (input.description.length > INPUT_LIMITS.description) {
    throw new InvalidLyricsInputError(
      `description exceeds ${INPUT_LIMITS.description} characters`,
    );
  }
  for (const [name, list] of [
    ["genres", input.genres],
    ["moods", input.moods],
    ["themes", input.themes],
    ["structure", input.structure ?? []],
  ] as const) {
    const max =
      name === "structure"
        ? INPUT_LIMITS.structureSections
        : INPUT_LIMITS.listItems;
    if (list.length > max) {
      throw new InvalidLyricsInputError(`${name} exceeds ${max} items`);
    }
    if (list.some((item) => item.length > INPUT_LIMITS.listItemLength)) {
      throw new InvalidLyricsInputError(
        `${name} items must be at most ${INPUT_LIMITS.listItemLength} characters`,
      );
    }
  }
  if (input.tempo.length > INPUT_LIMITS.listItemLength) {
    throw new InvalidLyricsInputError("tempo too long");
  }
}

function buildLyricsPrompt(input: LyricsInput): string {
  const structure = input.structure?.length
    ? input.structure
    : DEFAULT_STRUCTURE;

  const lines = [
    `Write an original song based on this brief:`,
    ``,
    `Description: ${input.description}`,
  ];
  if (input.genres.length) lines.push(`Genre: ${input.genres.join(", ")}`);
  if (input.moods.length) lines.push(`Mood: ${input.moods.join(", ")}`);
  if (input.tempo) lines.push(`Tempo feel: ${input.tempo}`);
  if (input.themes.length) lines.push(`Themes: ${input.themes.join(", ")}`);
  lines.push(
    ``,
    `Section structure (use exactly these sections, in this order):`,
    structure.map((s) => `[${s}]`).join(" → "),
  );
  return lines.join("\n");
}

function buildRevisionPrompt(
  currentLyrics: string,
  instruction: string,
): string {
  return [
    `Here are the current lyrics of a song:`,
    ``,
    currentLyrics,
    ``,
    `Revise them according to this instruction: ${instruction}`,
    ``,
    `Keep the existing section structure and title unless the instruction asks otherwise. Return the complete revised lyrics, not just the changed sections.`,
  ].join("\n");
}

async function callLyricsModel(prompt: string): Promise<LyricsResult> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [SUBMIT_LYRICS_TOOL],
    tool_choice: { type: "tool", name: "submit_lyrics" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error(
      `Lyrics generation returned no structured output (stop_reason: ${response.stop_reason})`,
    );
  }

  const { title, lyrics } = toolUse.input as { title: string; lyrics: string };
  if (!title || !lyrics) {
    throw new Error("Lyrics generation returned an incomplete result");
  }
  return { title, lyrics };
}

export async function generateLyrics(
  input: LyricsInput,
): Promise<LyricsResult> {
  validateLyricsInput(input);
  return callLyricsModel(buildLyricsPrompt(input));
}

// Caps for revision calls — same cost-bounding role as INPUT_LIMITS.
const REVISION_LIMITS = {
  instruction: 500,
  lyrics: 10_000,
} as const;

export async function reviseLyrics(
  currentLyrics: string,
  instruction: string,
): Promise<LyricsResult> {
  if (!currentLyrics.trim()) {
    throw new InvalidLyricsInputError("currentLyrics is required");
  }
  if (currentLyrics.length > REVISION_LIMITS.lyrics) {
    throw new InvalidLyricsInputError(
      `currentLyrics exceeds ${REVISION_LIMITS.lyrics} characters`,
    );
  }
  if (!instruction.trim()) {
    throw new InvalidLyricsInputError("instruction is required");
  }
  if (instruction.length > REVISION_LIMITS.instruction) {
    throw new InvalidLyricsInputError(
      `instruction exceeds ${REVISION_LIMITS.instruction} characters`,
    );
  }
  return callLyricsModel(buildRevisionPrompt(currentLyrics, instruction));
}
