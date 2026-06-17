# ObsidianAI Study Helper

Turn raw course notes into a single, **Obsidian-ready study note** using AI, then keep every note in a searchable history. Built for INTP302 (Emerging Trends in Software Development) as a Cloud + AI midterm prototype.

**Live app:** https://studywithobsidian-cfavd0bsfdhnhjb4.canadacentral-01.azurewebsites.net

> ⚠️ **Study aid, not a source of truth.** Every Study Note is AI-generated and may contain mistakes. Always verify it against your original material before relying on it.

---

## What it does

You paste (or load) messy lecture notes — the **Study Material** — and the app produces one structured **Study Note**:

- a one-paragraph **summary**,
- **key concepts** (term + one-line definition), and
- 2–3 open-ended **review questions** (reflection prompts, no answers).

The output is **always in English**, regardless of the input language. Each Study Note is saved to Azure SQL and shown in a **history** list grouped by Course, where you can re-open or delete notes. You can then **download** the note as Obsidian markdown or send it **straight into Obsidian** with one click.

### Features

| Feature | Notes |
| --- | --- |
| Submit Study Material | Paste into a textarea or load a `.md` / `.txt` file; optional Course field; ~10,000-character cap |
| AI generation | Azure OpenAI `gpt-4.1-mini`, structured (strict JSON) output, always English |
| Persist + history | Saved to Azure SQL; history grouped by Course; open or delete any note |
| Export to Obsidian | Download a formatted `.md` (frontmatter, `[[wikilinks]]`, `> [!question]` callout, `ai-generated` tag) |
| Open in Obsidian | One click opens `obsidian://new` so the note is created directly in your vault. Also creates the note's **course hub** note if it's missing, so notes cluster by Course in the graph (requires Obsidian desktop — see Prerequisites) |

---

## Architecture flow

```
Browser (Next.js UI)
   │  POST /api/generate  { material, course }
   ▼
App Service (Next.js API route, server-side)
   │  Azure OpenAI gpt-4.1-mini → structured Study Note (always English)
   │  INSERT into Azure SQL (source of truth)
   ▼
JSON Study Note ──► UI renders it
                     ├─ Download .md  (client-side blob)
                     └─ Open in Obsidian  (obsidian://new URI)

History:  GET /api/notes          → list (grouped by Course)
          GET /api/notes/[id]     → one note
          DELETE /api/notes/[id]  → remove a note
```

Azure SQL is the **source of truth**; the Obsidian vault is an export-only destination (the app never reads back from the vault). See [`docs/adr/0001-azure-sql-source-of-truth-export-only-vault.md`](docs/adr/0001-azure-sql-source-of-truth-export-only-vault.md).

---

## Tech stack

- **Next.js 16** (App Router, TypeScript, Turbopack) + **React 19** + **Tailwind CSS v4**
- **Azure OpenAI** via the `openai` SDK (`AzureOpenAI`, API version `2024-10-21`)
- **Azure SQL** via `mssql` (cached connection pool; structured arrays stored as JSON in `NVARCHAR(MAX)`)

## Azure services

| Service | What it's for | Details |
| --- | --- | --- |
| **Azure App Service** | Hosts the Next.js app (UI + API routes) | Canada Central, Linux, Node 22 LTS, B1 |
| **Azure SQL Database** | Source of truth for Study Notes | Basic (DTU) tier, SQL authentication, East US |
| **Azure OpenAI** | Generates Study Notes | Model deployment `gpt-4.1-mini`, East US |

Deployment is via GitHub Actions (`.github/workflows/deploy.yml`): a push to `master` runs `npm ci` → `npm run build` → deploys to App Service using a publish profile stored in repo secrets.

---

## Prerequisites

Before running or using the app:

- **Node.js 20+** and npm (for local development).
- **An Azure subscription** with the three services above provisioned (App Service, Azure SQL, Azure OpenAI with a `gpt-4.1-mini` deployment).
- **Obsidian desktop** — *install it first if you want to use **Open in Obsidian***. That button hands the note to the `obsidian://` URI handler, which only exists once the Obsidian desktop app is installed (it registers the protocol on first launch). Without it, the browser has nothing to open — so install Obsidian **before** clicking the button. (The plain **Download** button works with or without Obsidian; you can drag the `.md` into any vault later.)

---

## Run locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables.** Copy the example and fill in your own Azure values:

   ```bash
   cp .env.example .env.local
   ```

   `.env.local` is gitignored — never commit real secrets.

   | Variable | Description |
   | --- | --- |
   | `AZURE_OPENAI_ENDPOINT` | Your Azure OpenAI resource endpoint URL |
   | `AZURE_OPENAI_KEY` | Azure OpenAI API key |
   | `AZURE_OPENAI_DEPLOYMENT` | Model deployment name (`gpt-4.1-mini`) |
   | `AZURE_SQL_CONNECTION_STRING` | Azure SQL connection string (ADO.NET / SQL-auth format) |

   In production these are set as **App Service Application Settings**, not in any file.

3. **Create the database table.** Run [`db/schema.sql`](db/schema.sql) once against your Azure SQL database (e.g. in the portal's Query editor).

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

To verify a production build and typecheck: `npm run build`.

---

## Known limitations

- **Text/markdown input only.** Markdown tables are supported, but images, diagrams, equations, and complex/multi-column PDF layouts cannot be represented and are out of scope.
- **Translation accuracy.** Because output is always English, **non-English Study Material is translated**, which can introduce technical-term inaccuracies. Verify translated terms against the source.
- **Open in Obsidian needs Obsidian desktop.** See Prerequisites. Use Download as the universal fallback.
- **Single-user by design.** No authentication; intended for one learner (the author). Not hardened for multi-user/public use.
- **Cross-region latency.** App Service (Canada Central) and Azure SQL (East US) are in different regions — negligible for a prototype.

---

## Responsible AI

This prototype was reviewed against Microsoft's Responsible AI principles.

- **Fairness.** Quality may drop on non-English material, heavy math notation, or niche jargon. Because output is always English, translating non-English Study Material can introduce technical-term inaccuracies — a limitation users should be aware of.
- **Reliability & Safety.** AI summaries can be wrong or hallucinated, so every note is explicitly labelled a *study aid* that must be verified against the source. Review Questions deliberately provide **no answers**, avoiding false authority.
- **Privacy & Security.** Study Material is sent to Azure OpenAI for processing. **Only sample/synthetic data is used — no real personal data.** API keys and the SQL connection string live server-side (App Service Application Settings / local `.env.local`), never in client code or the repository.
- **Inclusiveness.** Plain, keyboard-accessible UI with labelled controls; works with light and dark themes.
- **Transparency.** All AI output is labelled "AI-generated" in the UI, and exported notes carry an `ai-generated` tag in their frontmatter and a verification reminder in the footer.
- **Accountability.** A human stays in the loop: the user reviews and edits the exported note in Obsidian before relying on it. The author is responsible for the deployed app and its outputs.

### Data & secrets

- **No secrets are committed.** `.env*` files are gitignored; only `.env.example` (placeholders, no values) is tracked. Production secrets are App Service Application Settings.
- **Sample data only.** The app is used with synthetic/sample Study Material — no real personal or sensitive data is stored.

---

## Future extensions

- **Multimodal input** — accept a screenshot/photo of notes and use vision to read tables and diagrams.
- **Vault sync** — re-import edited `.md` notes back into Azure SQL so edits are backed up (would supersede ADR 0001).
- **Obsidian plugin agent** — an AI agent that reads the vault and calls the deployed API as a tool to build a linked knowledge graph, with human review before writing.
- **Authentication** — identity and safe access for multi-device / multi-user use.
