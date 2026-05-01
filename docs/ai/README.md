# Ops Tracker — AI Knowledge System

This folder is the **persistent, source-of-truth knowledge base** that AI assistants (and humans) consult before reasoning about Ops Tracker. It complements — and never contradicts — the existing top-level docs (`README.md`, `docs/ARCHITECTURE.md`, `docs/SUPABASE_MIGRATIONS.md`) and the workspace rules under `.cursor/rules/`.

The goal is simple: **reduce hallucinations and re-discovery cost**. Anything an AI agent would otherwise have to infer by re-reading the codebase from scratch belongs here, written down, kept current, and verifiable against the code.

---

## Purpose

The AI documentation system exists to:

1. Give AI assistants a fast, structured way to load *project-specific* context (stack, conventions, domain rules, gotchas) before touching code.
2. Capture **decisions and invariants** that are not obvious from reading any single file (e.g. "DB enum is `bug | ticket` but the UI says *Bug* / *Task*").
3. Document **how work is done** in this repo — workflows, roles, review expectations — so contributors and agents follow the same path.
4. Provide a stable home for **diagrams**, **per-feature deep dives**, and **active plans**, separated from runtime code.
5. Serve as an **onboarding manual** for any new contributor (human or AI) joining the project.

This is *not* a marketing document, a design pitch, or a roadmap wishlist. It is operational knowledge.

---

## Folder layout

```
docs/ai/
  README.md            ← this file
  architecture/        ← system-level architecture notes that go beyond docs/ARCHITECTURE.md
  domains/             ← business domain models (issues, projects, users, audit, …)
  standards/           ← coding, naming, styling, i18n, accessibility, testing standards
  workflows/           ← how-to guides: adding a feature, a server action, a migration, a translation
  roles/               ← role/persona references (user, admin, super_admin) and what each can do
  diagrams/            ← Mermaid / image diagrams referenced from other docs
  context/             ← cross-cutting context: glossary, gotchas, env vars, third-party services
  current-features/    ← one file per shipped feature, describing real behavior in production
  plans/               ← active design docs and in-flight plans (must be dated and owned)
```

Subfolders are intentionally empty until there is real content to put in them. **Do not add placeholder files just to populate a directory.**

---

## How to use this folder

### If you are an AI assistant

1. **Read this README first** on any non-trivial task in this repo.
2. Then read, in order of likely relevance:
   - `architecture/` and `domains/` for *what the system is*.
   - `standards/` and `workflows/` for *how we change it*.
   - `current-features/<feature>.md` if the task touches a specific feature.
   - `context/` for glossary terms and known gotchas.
   - `plans/` only if the user is asking about in-flight work.
3. Treat the contents here as **authoritative over your priors** when they conflict.
4. If you discover a fact while working that future-you would have wanted to know, **propose a doc update in the same change**.
5. If a doc contradicts the code, the **code wins** — flag the doc as stale and fix it.

### If you are a human contributor

1. Skim this README and the relevant subfolder before starting larger work.
2. When you ship something non-trivial (new feature, new domain concept, new convention, new gotcha), add or update the corresponding doc in the same PR.
3. Treat doc updates as part of "done", not as follow-up work.

---

## Maintenance rules

These rules are enforced by review (and by AI assistants, who should refuse to write docs that violate them):

1. **Reflect real code, never speculation.** Every claim must be traceable to a file, symbol, table, route, or commit in this repository. If it isn't true *today*, it doesn't go in `architecture/`, `domains/`, `standards/`, `workflows/`, `roles/`, or `current-features/`. Forward-looking material lives only in `plans/` and must be marked as such.
2. **No placeholder or stub files.** A folder stays empty until there is real content. Empty `TODO.md` files, "coming soon" notes, and AI-generated filler are not allowed.
3. **One topic per file.** Prefer many small, focused files over a few sprawling ones. File names are kebab-case and descriptive (`issue-soft-delete.md`, not `notes.md`).
4. **Cite the code.** When a doc describes a behavior, reference the file path (and ideally the symbol) that implements it. If the path changes, the doc must change.
5. **Keep it current on every relevant change.** If a PR changes behavior described here, update the doc in the same PR. Stale docs are worse than missing docs.
6. **Do not duplicate top-level docs.** If something already lives in `README.md`, `docs/ARCHITECTURE.md`, `docs/SUPABASE_MIGRATIONS.md`, or `.cursor/rules/`, link to it instead of restating it. Add value here, don't fork the source of truth.
7. **`plans/` entries must be dated and owned.** Each plan file starts with a header containing the date created, the author, and the status (`draft` / `in progress` / `accepted` / `superseded`). When a plan ships, summarize the outcome in the appropriate permanent folder and either delete the plan or mark it `superseded`.
8. **No secrets, no credentials, no customer data.** Ever. Use `src/lib/env.ts` references and example values only.
9. **Markdown only, with optional Mermaid.** Diagrams live in `diagrams/` and are referenced from other files; do not paste binary screenshots when a Mermaid diagram will do.
10. **English only.** User-facing strings are translated via `next-intl`; internal docs are not.

---

## Verifying a doc against the code

Before merging any change in `docs/ai/`, the author (human or AI) must be able to answer **yes** to all of:

- Does every factual statement correspond to code that currently exists on the default branch?
- Are all referenced file paths, table names, route paths, env var names, and role names spelled exactly as in the code?
- If this doc described behavior, did I open the implementing file(s) while writing it?
- If this doc contradicts another doc in the repo, did I reconcile them?

If any answer is no, the doc is not ready.

---

## Out of scope

- Product marketing, sales material, or external-facing copy.
- User-facing help content (that belongs in the app via `next-intl`).
- Personal notes or scratchpads — keep those out of the repo.
- Speculative architecture for features that have not been agreed upon. Use `plans/` for proposals, and only after they are real work, not idle ideas.
