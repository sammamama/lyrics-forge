"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceStore } from "@/lib/store";
import { parseLyrics } from "@/lib/lyrics";

// Editable lyrics document. Styled section view by default; clicking the
// lyrics switches to a raw textarea so section tags stay plain text to edit.
export function LyricsCanvas() {
  const lyrics = useWorkspaceStore((s) => s.lyrics);
  const title = useWorkspaceStore((s) => s.title);
  const setLyrics = useWorkspaceStore((s) => s.setLyrics);
  const setTitle = useWorkspaceStore((s) => s.setTitle);

  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [editing]);

  if (!lyrics) {
    return (
      <div className="canvas-empty">
        Describe your song below to get started
      </div>
    );
  }

  return (
    <div className="lyrics-canvas">
      <input
        className="canvas-title"
        value={title}
        placeholder="Untitled"
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Song title"
      />
      {editing ? (
        <Textarea
          ref={textareaRef}
          className="canvas-editor rounded-none border-0 p-0 focus-visible:border-transparent focus-visible:ring-0"
          value={lyrics}
          onChange={(e) => {
            setLyrics(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onBlur={() => setEditing(false)}
          aria-label="Lyrics"
        />
      ) : (
        <div
          className="canvas-view"
          role="textbox"
          tabIndex={0}
          aria-label="Lyrics — click to edit"
          onClick={() => setEditing(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setEditing(true);
            }
          }}
        >
          {parseLyrics(lyrics).map((section, i) => (
            <section key={i} className="lyrics-section">
              {section.tag && (
                <span className="lyrics-tag">[{section.tag}]</span>
              )}
              {section.lines.map((line, j) =>
                line ? <p key={j}>{line}</p> : <br key={j} />,
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
