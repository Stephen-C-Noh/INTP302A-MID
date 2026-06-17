# 12-Hour Solo Build Plan — ObsidianAI Study Helper

Principle: **deploy on hour 1**, not the last day. Prove the Azure pipeline before building features.

Azure (already provisioned): RG `INTP-MidTerm-Project`, account `Study-With-Obsidian`, project `StudyApp-With-Obsidian`, model `gpt-4.1-mini`, region `eastus`. Chat playground verified working.

**Live app (#1 deployed):** https://studywithobsidian-cfavd0bsfdhnhjb4.canadacentral-01.azurewebsites.net — App Service `studywithobsidian` (Canada Central, B1), GitHub Actions CD on push to `master`.

| Window | Task | Done when |
|---|---|---|
| **H0–1** | ✅ Azure OpenAI / Foundry provisioned + `gpt-4.1-mini` deployment verified. Provision Azure SQL (Basic DTU) + create `StudyNotes` table. Create App Service plan (F1/B1). | OpenAI reachable, SQL table exists, App Service ready |
| **H1–2** | `create-next-app`, minimal UI (textarea + optional Course field + submit + result area), git repo, **deploy empty app to App Service** to prove the pipeline. | Public URL shows the app |
| **H2–4** | `/api/generate` route → Azure OpenAI call (JSON/structured output, one retry), prompt enforcing **always-English** output and the fixed contract (title, course, summary paragraph, keyConcepts term+def, 2–3 answerless questions). | Real Study Note JSON in UI from localhost |
| **H4–6** | Azure SQL: connect, save Study Note (+ sourceMaterial) on generate; history list grouped by Course; **delete** endpoint + button. | Records persist, list loads, delete works |
| **H6–8** | Obsidian markdown export: frontmatter (`title`, `course: "[[...]]"`, `created`, `tags: [study, ai-generated]`), summary, key concepts as `[[term]] — definition`, questions in `> [!question]` callout, footer disclaimer. Download button. | Exported `.md` opens cleanly in Obsidian, concepts/course show in graph |
| **H8–9.5** | Polish: loading states, error handling, ~10k char cap, `.md`/`.txt` client-side file load into textarea, empty states, basic styling. | App feels coherent |
| **H9.5–10.5** | Deploy final, set App Settings (OpenAI + SQL secrets), test from **a different browser/device** via public URL. | Works end-to-end on Azure |
| **H10.5–11.5** | README (setup, services, env vars, run-locally, **limitations** incl. layout/text-only, Responsible AI review). | Repo documented, no secrets committed |
| **H11.5–12** | Record 3–5 min demo (deployment + storage + AI with **English + Korean test inputs**), individual reflection (100–200 words). **Clean up resources after grading.** | All deliverables ready |

## Required env vars
```
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_KEY=
AZURE_OPENAI_DEPLOYMENT=gpt-4.1-mini
AZURE_SQL_CONNECTION_STRING=
```

## Key decisions (from grill — see CONTEXT.md + docs/adr/)
- One Study Material → one Study Note.
- Azure SQL = source of truth; vault export-only (ADR 0001).
- Output always English; JSON structured output enforced.
- No auth — personal single-user app.
- Input text/markdown only; multimodal image input is a future extension.
- History = view + delete; editing deferred (future: edit in Obsidian + re-import/vault sync).

## Deliverables checklist
- [x] Proposal (`proposal.md`) — convert to PDF/Word for D2L submission
- [x] Live Azure URL — https://studywithobsidian-cfavd0bsfdhnhjb4.canadacentral-01.azurewebsites.net
- [x] Public GitHub repo, meaningful commits, no secrets
- [x] README + Responsible AI review
- [ ] 3–5 min demo video (deployment + storage + AI feature, 2+ inputs)
- [x] Individual reflection (100–200 words) — `REFLECTION.md`
- [ ] Resources cleaned up (after grading)
