# Personal Reflection — ObsidianAI Study Helper

**Stephen Noh · INTP302 Midterm**

## Deploy first
The best decision I made was deploying an empty app to Azure App Service in the first hour. Proving the GitHub Actions pipeline before writing any real logic meant I never lost time fighting infrastructure under deadline pressure — deployment became a feature, not a final step.

## Making AI reliable
The hardest part was making the model trustworthy. Forcing structured JSON output with a one-retry fallback, and enforcing English-only generation, turned an unpredictable model into something I could render and store with confidence. It pushed me to treat AI as a component with a contract, not magic.

## Keeping data simple
Treating Azure SQL as the source of truth and the Obsidian vault as export-only (documented in an ADR) kept the data flow easy to reason about.

## What I'd change
I'd write the Responsible AI review earlier — naming the translation and hallucination risks up front would have shaped my prompts sooner. Overall, I came away more confident integrating cloud, storage, and AI into one coherent, deployed product.
