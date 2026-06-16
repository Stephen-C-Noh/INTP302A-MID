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

// Filenames Obsidian/OSes reject; collapse to a safe slug, keep it readable.
export function obsidianFileName(title: string): string {
  const base = title
    .replace(/[\\/:*?"<>|#^[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${base || "Study Note"}.md`;
}

export function toObsidianMarkdown(note: StudyNote, created = isoDate()): string {
  const title = note.title.trim();
  const course = sanitizeLinkTarget(note.course);

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
