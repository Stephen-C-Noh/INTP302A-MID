# Project Proposal — ObsidianAI Study Helper

**Course:** INTP302 Emerging Trends in Software Development — Midterm Team Mini-Project (Cloud + AI Prototype)

## Project Title
**ObsidianAI Study Helper** — turn raw course notes into a single, Obsidian-ready study note with AI.

## Team Members
- Stephen Noh — full stack (UI, API, Azure deployment, AI integration, storage, docs)

> Note: assignment specifies teams of 2–4. Solo participation to be confirmed with the instructor.

## Problem Statement
Students take messy, unstructured notes during lectures. Turning them into reviewable study material (summary, key concepts, reflection questions) is slow and manual. This app automates that and outputs the result in **Obsidian markdown** so it drops straight into a personal study vault.

## Target Users
A single learner (the author) who keeps notes in Obsidian. The app is personal and single-user by design — no other users are considered.

## Core Concepts (glossary)
See `CONTEXT.md`. In short:
- **Study Material** — the raw notes the user submits (input).
- **Study Note** — the single Obsidian-ready `.md` the AI produces (output). One input → one Study Note.
- **Key Concept** — a term + one-line definition, embedded as an Obsidian `[[wikilink]]`.
- **Course** — the subject a Study Note belongs to; rendered as `[[wikilink]]` so notes cluster by course in the graph.
- **Review Question** — an open-ended reflection prompt (no answer provided); "food for thought."

## Midterm Scope (core features)
1. Submit Study Material — paste into a textarea, or load a `.md`/`.txt` file (read client-side into the textarea). Optional Course field. ~10,000 character cap.
2. AI generates a Study Note: a paragraph **summary**, **key concepts** (term + one-line definition), and **2–3 reflection questions** (no answers). Output is **always in English** regardless of input language.
3. Persist each Study Note (+ original Study Material) in Azure SQL — the source of truth and backup. View and **delete** from a history list, grouped by Course.
4. **Export to Obsidian** — download a formatted `.md` (frontmatter with `course` and `ai-generated` tag, key concepts as `[[wikilinks]]`, questions in a `> [!question]` callout).

## Azure Services
- **Hosting:** Azure App Service (Next.js, frontend + API routes in one codebase).
- **Storage:** Azure SQL Database (serverless / free tier) — Study Note records.
- **AI:** Azure OpenAI / Microsoft Foundry, model `gpt-4.1-mini`. Resource group `INTP-MidTerm-Project`, account `Study-With-Obsidian`, project `StudyApp-With-Obsidian`, region `eastus`.
- **Secrets:** `.env.local` locally, App Service Application Settings in production.

## AI Input and Output
- **Input:** plain text / markdown Study Material (+ optional Course).
- **Output:** structured JSON, enforced via the model's JSON/structured-output mode (one retry on parse failure):
  ```json
  {
    "title": "string",
    "course": "string (user value if provided, else AI-inferred)",
    "summary": "string (one paragraph, English)",
    "keyConcepts": [{ "term": "...", "definition": "..." }],
    "questions": ["open-ended reflection prompt", "..."]
  }
  ```

## Data Storage Plan
Azure SQL is the **source of truth** for the originally generated Study Note; the vault is export-only (see ADR 0001). Single table, structured arrays stored as JSON:
```sql
CREATE TABLE StudyNotes (
  id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  title         NVARCHAR(300)  NOT NULL,
  course        NVARCHAR(200)  NULL,
  sourceMaterial NVARCHAR(MAX) NOT NULL,
  summary       NVARCHAR(MAX)  NOT NULL,
  keyConcepts   NVARCHAR(MAX)  NOT NULL,  -- JSON [{term, definition}]
  questions     NVARCHAR(MAX)  NOT NULL,  -- JSON ["...", "..."]
  createdAt     DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME()
);
```
**Sample/synthetic notes only — no real personal data.** Connection string held server-side in App Settings.

## Architecture Flow
User submits Study Material (+ optional Course) in the Next.js UI → `POST /api/generate` (App Service, server-side) → Azure OpenAI `gpt-4.1-mini` returns the structured Study Note (always English) → record saved to Azure SQL → JSON returned → UI renders the Study Note → user clicks **Export to Obsidian** → downloads a formatted `.md`. The history list reads past Study Notes (grouped by Course) from Azure SQL, with view and delete.

## Responsible AI Concerns
- **Fairness:** quality may drop on non-English Study Material, heavy math notation, or niche jargon. Because output is always English, **translating non-English material can introduce technical-term inaccuracies.**
- **Reliability & Safety:** AI summaries can be wrong or hallucinated — labelled a *study aid*, must be verified against the source. Review Questions deliberately provide no answers (no false authority).
- **Privacy & Security:** Study Material is sent to Azure OpenAI; sample data only; API keys and SQL connection string kept server-side, never in client code or repo.
- **Inclusiveness:** plain, keyboard-accessible UI.
- **Transparency:** all output labelled "AI-generated," and exported notes carry an `ai-generated` tag in frontmatter.
- **Accountability:** the user reviews/edits the exported note in Obsidian — human-in-the-loop.
- **Known limitation (layout):** input is text/markdown only. Markdown tables are supported; images, diagrams, equations, and complex/multi-column PDF layouts cannot be represented and are out of scope (see Future Extensions).

## Future Extension (Agentic AI / Unit 3)
- **Multimodal image input:** accept a screenshot/image of Study Material and use `gpt-4.1-mini`'s vision to read tables and diagrams.
- **Edit + vault sync:** edit Study Notes in Obsidian/IDE and re-import edited `.md` back into Azure SQL so edits are also backed up (would supersede ADR 0001).
- **Obsidian plugin agent:** an AI agent that reads the vault and calls the deployed API as a **tool** — generate linked study notes, build a `[[wikilink]]` knowledge graph, run spaced-repetition quizzes, track progress, with the human reviewing before notes are written.
- **Identity & safe access:** add authentication for multi-device/multi-user use.

## Risks and Limitations
- Solo timeline (~12h) is tight; deployment validated early to de-risk.
- Layout-heavy material is out of scope for the midterm (text/markdown only).
- Generated questions are reflection prompts, not a substitute for the source material.
