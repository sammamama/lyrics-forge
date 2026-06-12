// Parse Suno-format lyrics ([Verse 1], [Chorus] tags on their own lines)
// into sections for styled rendering.

export interface LyricsSection {
  /** Section tag without brackets, e.g. "Verse 1". Empty for untagged text. */
  tag: string;
  lines: string[];
}

const TAG_LINE = /^\s*\[([^\]]+)\]\s*$/;

export function parseLyrics(lyrics: string): LyricsSection[] {
  const sections: LyricsSection[] = [];
  let current: LyricsSection | null = null;

  for (const rawLine of lyrics.split("\n")) {
    const tagMatch = rawLine.match(TAG_LINE);
    if (tagMatch) {
      current = { tag: tagMatch[1], lines: [] };
      sections.push(current);
      continue;
    }
    const line = rawLine.trimEnd();
    if (!line && (!current || current.lines.length === 0)) continue;
    if (!current) {
      current = { tag: "", lines: [] };
      sections.push(current);
    }
    current.lines.push(line);
  }

  // Drop trailing blank lines within each section.
  for (const section of sections) {
    while (
      section.lines.length &&
      !section.lines[section.lines.length - 1]
    ) {
      section.lines.pop();
    }
  }
  return sections.filter((s) => s.tag || s.lines.length);
}
