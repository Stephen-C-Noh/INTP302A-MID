"use client";

import { useState } from "react";
import { MAX_MATERIAL_CHARS, type StudyNote } from "@/lib/studyNote";
import { obsidianFileName, toObsidianMarkdown } from "@/lib/obsidian";

export default function Home() {
  const [material, setMaterial] = useState("");
  const [course, setCourse] = useState("");
  const [note, setNote] = useState<StudyNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooLong = material.length > MAX_MATERIAL_CHARS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material, course }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed.");
      setNote(data as StudyNote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            ObsidianAI Study Helper
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Turn raw course notes into a single, Obsidian-ready study note.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Course (optional)</span>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. Biology 101 — left blank, the AI infers it"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="flex items-center justify-between text-sm font-medium">
              <span>Study Material</span>
              <span
                className={
                  tooLong
                    ? "text-red-600 dark:text-red-400"
                    : "text-zinc-400"
                }
              >
                {material.length.toLocaleString()} /{" "}
                {MAX_MATERIAL_CHARS.toLocaleString()}
              </span>
            </span>
            <textarea
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Paste your raw course notes here…"
              rows={12}
              className="resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <button
            type="submit"
            disabled={!material.trim() || tooLong || loading}
            className="self-start rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading ? "Generating…" : "Generate Study Note"}
          </button>
        </form>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        {note && <StudyNoteView note={note} />}
      </main>
    </div>
  );
}

function StudyNoteView({ note }: { note: StudyNote }) {
  function handleExport() {
    const blob = new Blob([toObsidianMarkdown(note)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = obsidianFileName(note.title);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <article className="flex flex-col gap-5 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            AI-generated · {note.course}
          </span>
          <h2 className="text-2xl font-semibold">{note.title}</h2>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="shrink-0 self-start rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Export to Obsidian
        </button>
      </div>

      <section className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-zinc-500">Summary</h3>
        <p className="leading-7">{note.summary}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-zinc-500">Key Concepts</h3>
        <ul className="flex flex-col gap-1.5">
          {note.keyConcepts.map((c) => (
            <li key={c.term} className="leading-6">
              <span className="font-medium">{c.term}</span>
              <span className="text-zinc-500"> — {c.definition}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-zinc-500">
          Review Questions
        </h3>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          {note.questions.map((q, i) => (
            <li key={i} className="leading-6">
              {q}
            </li>
          ))}
        </ul>
      </section>

      <p className="border-t border-zinc-200 pt-3 text-xs text-zinc-400 dark:border-zinc-800">
        AI-generated study note. Verify against the source before relying on it.
      </p>
    </article>
  );
}
