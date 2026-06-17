"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAX_MATERIAL_CHARS,
  type SavedStudyNote,
  type StudyNote,
  type StudyNoteSummary,
} from "@/lib/studyNote";
import {
  obsidianFileName,
  obsidianHubUri,
  obsidianNewUri,
  toObsidianMarkdown,
} from "@/lib/obsidian";

const ACCEPTED_FILE_TYPES = ".md,.markdown,.txt,text/markdown,text/plain";
const VAULT_STORAGE_KEY = "obsidian-vault-name";

export default function Home() {
  const [material, setMaterial] = useState("");
  const [course, setCourse] = useState("");
  const [note, setNote] = useState<SavedStudyNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<StudyNoteSummary[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trimmedLength = material.trim().length;
  const tooLong = material.length > MAX_MATERIAL_CHARS;
  const isEmpty = trimmedLength === 0;

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/notes");
      if (!res.ok) return;
      setHistory((await res.json()) as StudyNoteSummary[]);
    } catch {
      // History is non-critical; fail quietly.
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleSelect(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/notes/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load the note.");
      setNote(data as SavedStudyNote);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the note.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this Study Note? This can't be undone.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete the note.");
      }
      // Clear the detail view if the open note is the one we just deleted.
      setNote((current) => (current?.id === id ? null : current));
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete the note.");
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input so re-selecting the same file fires onChange again.
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      setMaterial(text);
    } catch {
      setError(`Could not read "${file.name}". Try copying the text in instead.`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEmpty) {
      setError("Add some study material before generating a note.");
      return;
    }
    if (tooLong) {
      setError(
        `Study Material is too long. Trim it to ${MAX_MATERIAL_CHARS.toLocaleString()} characters or fewer.`,
      );
      return;
    }
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
      setNote(data as SavedStudyNote);
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-14 sm:py-20">
      <header className="flex flex-col items-center gap-4 text-center">
        <span
          className="inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg shadow-accent/30 ring-1 ring-white/20"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--accent-strong), var(--accent))",
          }}
        >
          <GemMark />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold tracking-tight">
            <span className="text-gradient">ObsidianAI</span> Study Helper
          </h1>
          <p className="text-balance text-muted">
            Turn raw course notes into a single, Obsidian-ready study note.
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-black/5 sm:p-7"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Course (optional)</span>
          <input
            type="text"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="e.g. Biology 101 — leave blank and the AI infers it"
            className="rounded-xl border border-border bg-surface-2/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between text-sm font-medium">
            <span>Study Material</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                tooLong
                  ? "bg-danger/10 text-danger"
                  : "bg-surface-2 text-muted"
              }`}
            >
              {material.length.toLocaleString()} /{" "}
              {MAX_MATERIAL_CHARS.toLocaleString()}
            </span>
          </span>
          <textarea
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="Paste your raw course notes here, or load a .md / .txt file…"
            rows={12}
            className="resize-y rounded-xl border border-border bg-surface-2/50 px-3.5 py-3 text-sm leading-6 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFile}
            className="hidden"
          />
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 font-medium text-muted transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Load .md / .txt file
            </button>
            {tooLong && (
              <span className="text-danger">
                Over the {MAX_MATERIAL_CHARS.toLocaleString()}-character limit —
                trim it before generating.
              </span>
            )}
          </div>
        </label>

        <button
          type="submit"
          disabled={isEmpty || tooLong || loading}
          style={{
            backgroundImage:
              "linear-gradient(120deg, var(--accent-strong), var(--accent))",
          }}
          className="group inline-flex items-center justify-center gap-2 self-start rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-all hover:-translate-y-0.5 hover:shadow-accent/40 active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Generating…
            </>
          ) : (
            <>
              <SparkleIcon />
              Generate Study Note
            </>
          )}
        </button>
      </form>

      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <svg
            viewBox="0 0 24 24"
            className="mt-0.5 h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </p>
      )}

      {note && <StudyNoteView note={note} />}

      {history.length > 0 && (
        <HistoryView
          history={history}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      )}
    </main>
  );
}

function GemMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" aria-hidden>
      <path d="M16 2.5 27 12 16 29.5 5 12Z" fill="#fff" fillOpacity="0.92" />
      <path d="M16 2.5 16 29.5 5 12Z" fill="#fff" fillOpacity="0.5" />
      <path
        d="M5 12h22"
        stroke="#fff"
        strokeOpacity="0.45"
        strokeWidth="0.9"
      />
      <path
        d="M16 2.5v27"
        stroke="#fff"
        strokeOpacity="0.4"
        strokeWidth="0.9"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.5l1.8 5.2 5.2 1.8-5.2 1.8L12 16.5l-1.8-5.2L5 9.5l5.2-1.8L12 2.5zM19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14z" />
    </svg>
  );
}

function HistoryView({
  history,
  onSelect,
  onDelete,
}: {
  history: StudyNoteSummary[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  // Group by course, preserving the (newest-first) order entries arrive in.
  const byCourse = new Map<string, StudyNoteSummary[]>();
  for (const item of history) {
    const key = item.course?.trim() || "Uncategorized";
    const list = byCourse.get(key) ?? [];
    list.push(item);
    byCourse.set(key, list);
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
          History
        </h2>
        <div className="h-px flex-1 bg-border" />
      </div>
      {[...byCourse.entries()].map(([course, items]) => (
        <div key={course} className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <span className="truncate">
              <span className="text-accent/50">[[</span>
              <span className="text-accent">{course}</span>
              <span className="text-accent/50">]]</span>
            </span>
            <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-normal text-muted">
              {items.length}
            </span>
          </h3>
          <ul className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-1.5 shadow-sm shadow-black/5">
            {items.map((item) => (
              <li
                key={item.id}
                className="group flex items-center gap-1 rounded-lg transition-colors hover:bg-accent-soft"
              >
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="flex min-w-0 flex-1 items-baseline justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm"
                >
                  <span className="truncate font-medium transition-colors group-hover:text-accent">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  aria-label={`Delete "${item.title}"`}
                  title="Delete"
                  className="shrink-0 rounded-lg p-2 text-muted opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function StudyNoteView({ note }: { note: StudyNote }) {
  const [vault, setVault] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  // Remember the vault name across sessions so it's typed once.
  useEffect(() => {
    setVault(localStorage.getItem(VAULT_STORAGE_KEY) ?? "");
  }, []);

  function handleVaultChange(value: string) {
    setVault(value);
    localStorage.setItem(VAULT_STORAGE_KEY, value);
  }

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

  async function handleOpenInObsidian() {
    // Copy the markdown first so the user can paste if the obsidian:// handler
    // isn't registered (no desktop Obsidian) and nothing visibly happens.
    try {
      await navigator.clipboard.writeText(toObsidianMarkdown(note));
      setHint("Opening Obsidian… (note also copied to your clipboard)");
    } catch {
      setHint("Opening Obsidian…");
    }
    // Ensure the course hub note exists first (silently) so this note clusters
    // around it in the graph, then open the note itself. Two obsidian:// calls
    // need a beat between them so the OS handler fires both.
    const course = note.course?.trim();
    if (course) {
      window.location.href = obsidianHubUri(course, vault);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    window.location.href = obsidianNewUri(note, vault);
  }

  return (
    <article className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-accent/5 sm:p-7">
      {/* Accent rail down the left edge to mark this as the generated artifact. */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{
          backgroundImage:
            "linear-gradient(180deg, var(--accent-strong), var(--accent))",
        }}
        aria-hidden
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
            <SparkleIcon />
            AI-generated · {note.course}
          </span>
          <h2 className="text-2xl font-semibold tracking-tight">
            {note.title}
          </h2>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleOpenInObsidian}
              style={{
                backgroundImage:
                  "linear-gradient(120deg, var(--accent-strong), var(--accent))",
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md shadow-accent/30 transition-all hover:-translate-y-0.5 hover:shadow-accent/40"
            >
              <GemMark />
              Open in Obsidian
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
              </svg>
              Download
            </button>
          </div>
          <input
            type="text"
            value={vault}
            onChange={(e) => handleVaultChange(e.target.value)}
            placeholder="Obsidian vault (optional)"
            aria-label="Obsidian vault name"
            className="w-full rounded-lg border border-border bg-surface-2/50 px-2.5 py-1.5 text-xs outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 sm:w-52"
          />
          {hint && (
            <p className="text-xs text-muted sm:max-w-52 sm:text-right">
              {hint}
            </p>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <SectionLabel>Summary</SectionLabel>
        <p className="leading-7 text-fg/90">{note.summary}</p>
      </section>

      <section className="flex flex-col gap-2.5">
        <SectionLabel>Key Concepts</SectionLabel>
        <ul className="flex flex-col gap-2">
          {note.keyConcepts.map((c) => (
            <li
              key={c.term}
              className="rounded-xl border border-border bg-surface-2/40 px-3.5 py-2.5 leading-6"
            >
              <span className="font-medium text-accent">
                <span className="text-accent/50">[[</span>
                {c.term}
                <span className="text-accent/50">]]</span>
              </span>
              <span className="text-muted"> — {c.definition}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Obsidian "> [!question]" callout, rendered in the app for parity. */}
      <section className="flex flex-col gap-2.5 rounded-xl border border-accent/25 bg-accent-soft/50 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-accent">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            ?
          </span>
          Review Questions
        </h3>
        <ul className="flex flex-col gap-2 pl-1">
          {note.questions.map((q, i) => (
            <li key={i} className="flex gap-2.5 leading-6">
              <span className="font-mono text-sm text-accent/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="border-t border-border pt-4 text-xs text-muted">
        AI-generated study note. Verify against the source before relying on it.
      </p>
    </article>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {children}
    </h3>
  );
}
