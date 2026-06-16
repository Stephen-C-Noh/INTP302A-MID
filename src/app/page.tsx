"use client";

import { useState } from "react";

export default function Home() {
  const [material, setMaterial] = useState("");
  const [course, setCourse] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Walking skeleton (#1): no generation yet — that arrives in #2.
    setNotice(
      `Received ${material.trim().length} characters${
        course.trim() ? ` for course "${course.trim()}"` : ""
      }. Study Note generation lands in issue #2.`,
    );
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
            <span className="text-sm font-medium">Study Material</span>
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
            disabled={!material.trim()}
            className="self-start rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Generate Study Note
          </button>
        </form>

        {notice && (
          <p className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            {notice}
          </p>
        )}
      </main>
    </div>
  );
}
