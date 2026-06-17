// Pure conversion from a Study Note to Obsidian-ready markdown (see issue #5).
// No I/O here — the UI wires the download.

import type { StudyNote } from "@/lib/studyNote";

// Local YYYY-MM-DD (Obsidian's default `created` format).
function isoDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// `[[wikilink]]` targets can't contain Obsidian's reserved link chars.
function sanitizeLinkTarget(text: string): string {
  return text.replace(/[[\]|#^]/g, " ").replace(/\s+/g, " ").trim();
}

// The `[[wikilink]]` target / hub-note basename for a course. The frontmatter
// link and the course hub note must use the *same* string, or the link won't
// resolve to the hub — so both go through here.
export function obsidianCourseTarget(course: string): string {
  return sanitizeLinkTarget(course);
}

// A safe, readable note name with reserved chars stripped (no extension —
// used both for the download filename and the obsidian:// `file` param).
export function obsidianNoteName(title: string): string {
  const base = title
    .replace(/[\\/:*?"<>|#^[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return base || "Study Note";
}

// Filenames Obsidian/OSes reject; collapse to a safe slug, keep it readable.
export function obsidianFileName(title: string): string {
  return `${obsidianNoteName(title)}.md`;
}

// `obsidian://new` URI that creates the note directly in the user's vault.
// Built with encodeURIComponent (not URLSearchParams, which encodes spaces as
// "+" and breaks Obsidian's decodeURIComponent parsing). A blank vault omits
// the param, so Obsidian falls back to the last-open vault.
//
// `overwrite=true` makes re-import idempotent: opening the same note twice
// overwrites the same-titled file instead of piling up "Title 1.md" copies.
// We can't detect existing notes ourselves — the vault is export-only (ADR
// 0001), so Azure SQL is the source of truth and the vault is disposable.
export function obsidianNewUri(note: StudyNote, vault?: string): string {
  const parts = [
    `file=${encodeURIComponent(obsidianNoteName(note.title))}`,
    `content=${encodeURIComponent(toObsidianMarkdown(note))}`,
    `overwrite=true`,
  ];
  if (vault?.trim()) {
    parts.unshift(`vault=${encodeURIComponent(vault.trim())}`);
  }
  return `obsidian://new?${parts.join("&")}`;
}

// `obsidian://new` URI that ensures the course hub note exists, so study notes
// cluster around it in the graph (Obsidian's default `hideUnresolved` hides
// hubs that aren't real files). `append=true` creates the hub if missing and
// leaves an existing one untouched — we pass no content, so nothing is added
// to a hub that already exists. `silent=true` keeps focus on the study note we
// open right after. The file basename matches the frontmatter `[[course]]`.
export function obsidianHubUri(course: string, vault?: string): string {
  const parts = [
    `file=${encodeURIComponent(obsidianCourseTarget(course))}`,
    `append=true`,
    `silent=true`,
  ];
  if (vault?.trim()) {
    parts.unshift(`vault=${encodeURIComponent(vault.trim())}`);
  }
  return `obsidian://new?${parts.join("&")}`;
}

export function toObsidianMarkdown(note: StudyNote, created = isoDate()): string {
  const title = note.title.trim();
  const course = obsidianCourseTarget(note.course);

  const frontmatter = [
    "---",
    `title: "${title.replace(/"/g, '\\"')}"`,
    `course: "[[${course}]]"`,
    `created: ${created}`,
    "tags: [study, ai-generated]",
    "---",
  ].join("\n");

  const keyConcepts = note.keyConcepts
    .map((c) => `- [[${sanitizeLinkTarget(c.term)}]] — ${c.definition.trim()}`)
    .join("\n");

  const questions = note.questions
    .map((q) => `> - ${q.trim()}`)
    .join("\n");

  return `${frontmatter}

# ${title}

## Summary
${note.summary.trim()}

## Key Concepts
${keyConcepts}

## Review Questions
> [!question] Food for thought
${questions}

---
*AI-generated study note. Verify against the source.*
`;
}
