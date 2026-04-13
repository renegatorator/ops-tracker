# Changelog

All notable changes to Ops Tracker are documented here.
Dates follow the **YYYY-MM-DD** format. Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

## [2.1.2] — 2026-04-13

### Added

- **README redesign** — Root `README.md` restructured to match the portfolio project README style: emoji heading, blockquote summary, shields.io version badges, emoji `##`/`###` section hierarchy, and consistent horizontal-rule separators between all major sections.

### Changed

- **README section order** — Content reorganised into canonical sections (Features, Tech Stack, Quick Start, Available Scripts, Project Structure, Environment Variables, Database, Architecture Notes, Roles, E2E Tests, Deployment, Author) mirroring the cross-project doc standard.
- **ARCHITECTURE.md updated** — Architecture documentation refreshed to reflect current project structure and conventions.

### Fixed

- **Board UI stale after issue creation** — Creating a new issue on the Kanban board or the project issues page no longer requires a manual refresh. `CreateIssueModal` now invalidates `issueQueryKeys.lists()` and `projectQueryKeys.all` on success, matching the behaviour of drag-and-drop status transitions.

---

## [2.1.1] — 2026-04-13

### Added

- **Issue type icons** — Bug and Ticket issues now display a coloured icon (bug/clipboard) on Kanban board cards and on the issue detail page next to the issue key.
- **Editable issue type** — The issue type (Bug / Ticket) can be changed on the issue detail page via a segmented control (admins only). The change is persisted, audited, and reflected immediately via optimistic update.
- **Assignee name on board cards** — Kanban cards now show the assignee's full name (or email if no name is set) below the issue title.
- **Settings gear in projects table** — Admins see a gear icon button per project row in the projects list, linking directly to that project's settings page.
- **SVG flag language switcher** — The language selector now renders actual SVG country flags (via `react-country-flag`) instead of emoji sequences, fixing invisible flags on Windows. The trigger button shows the active flag; the dropdown lists flag + language name.
- **Button plus icons** — New Project, New Issue, Add Member, and Create Project buttons now show a leading plus icon (`@tabler/icons-react`). The icon is hidden on the New Project button when it switches to its Cancel label.
- **Audit action translations** — All known action keys (e.g. `issue.status_transition`, `issue.assign`) are now mapped to human-readable labels in English, Slovenian, and German via a new `admin.audit.actions` translation block.

### Changed

- **No redirect after issue creation** — Creating an issue no longer navigates to the new issue page; the modal closes and a success notification is shown instead.
- **Project subnav replaced with icon buttons** — The Board / Issues / Settings text-button strip is replaced with icon-only `ActionIcon` buttons. The active view gets a filled blue background and a soft glow. The Settings gear is pushed to the far right.
- **Board page header** — The title now reads `{KEY} · {Project Name}` and the "New issue" button sits in the same row, aligned to the right.
- **Kanban column height** — All status columns now stretch to the same height regardless of how many cards they contain.
- **Action columns right-aligned** — The action button columns in the projects table and the project members table are now right-aligned.
- **Project subnav constrained to container width** — The subnav is now wrapped in the same `Container size="xl"` as the board and issues pages so the icons line up with the content below.
- **New Project button style** — Matches the New Issue button (filled blue, `variant="light"` removed) for visual consistency.
- **Audit shared utilities** — Pure helpers (`auditActionKey`, `auditActionColor`, `auditMetadataPreview`) and the translation hook (`useAuditTranslations`) extracted into `audit-utils.ts` and `hooks/useAuditTranslations.ts` and reused across `AdminAuditLogPanel` and `IssueAuditActivitySection`.

### Fixed

- **Settings button active state** — The settings icon was incorrectly highlighted as the board view when on the settings page; active-state logic now checks settings first.
- **Raw action keys in audit views** — The Action column in the admin audit log and the Action badge in the issue activity section now display translated labels instead of raw strings like `ISSUE.STATUS_TRANSITION`. Entity type labels in the admin audit log are also translated.

---

## [2.1.0] — 2026-04-12

### Added

- **Issue types** — Issues can now be classified as **Bug** or **Ticket** at creation time. A new `issue_type` column (Postgres enum) is stored on the `issues` table.
- **Create issue on board** — Administrators now see a **"New issue"** button directly on the project Kanban board, opening the create-issue modal without navigating away.
- **Assignee field in create modal** — The create-issue modal now includes an **Assignee** selector so issues can be assigned at creation time.
- **Description required for tickets** — When creating a Ticket (as opposed to a Bug), the description field is now **required** and the textarea is taller (6 rows min).
- **Workflow statuses** — Default statuses seeded via migration: **Open → In Progress → Ready for Deployment → Testing → Done**.
- **Professional landing page** — The home page was redesigned with logo, feature highlights grid, and two disabled demo buttons ("Demo as User", "Demo as Admin") marked as coming soon.
- **Super admin: rename project** — Super admins can now rename an existing project from the project Settings page. The rename is guarded by a dedicated `renameProject` server action (super_admin role only) and recorded in the audit log.
- **Project-scoped issues** — Issues belong to a project; each issue gets a human-readable key (e.g. `OPS-12`).
- **Kanban board** — Per-project drag-and-drop board powered by `@dnd-kit/core`. Dropping a card on a column triggers a status transition.
- **Project members & settings** — Admins can add/remove project members. A project settings page is available under the project sub-navigation.
- **Project sub-navigation** — Board / Issues / Settings tab strip under each project.
- **Project switcher** — Workspace header now includes a project quick-jump dropdown.
- **Dashboard** — Overview page showing active projects, open issues, and personal assignments.

### Changed

- **Issue detail page is now read-only by default** — Title and description are displayed as plain text. A pencil icon button reveals the edit form; a Cancel button reverts changes without saving.
- **Audit activity section** — The raw truncated JSON "Details" column was replaced with two meaningful columns: **Issue key** and **Summary** (e.g. "Updated: title, description", "Assigned to …", "Status → …"). Action labels are colour-coded badges.
- **Board column appearance** — Kanban columns now use consistent backgrounds in both light (`gray-1`) and dark (`dark-6`) themes with visible borders.
- **Login page** — Removed the redundant "Sign in" heading and the inline email description hint; the form is cleaner without them.

### Fixed

- **Migration safety** — Backfill `INSERT` in `20260412200000` now guards against a fresh database with no user profiles, preventing a `NOT NULL` violation on `created_by`.
- **Error message translations** — Error keys returned by server actions in `ProjectSettingsPageClient` and `CreateIssueModal` now resolve through the correct `projects` / `issues` namespace.
- **Assignee query gating** — `useAssigneeFilterOptions` in `IssueDetailPanel` no longer fires before the issue's `project_id` is loaded.
- **Issue update revalidation** — `updateIssue` now returns `project_key` so `revalidateIssuesSegment` can target the correct project route cache.
- **Search injection** — `sanitizeSearch` now also strips `,`, `(`, `)`, and `/` to prevent PostgREST `or()` filter injection.
- **Audit log i18n** — Summary strings in the audit activity section are now translated (en/de/si) and dates use `toLocaleString(locale)`.
- **E2E test reliability** — The critical-path spec now clicks the edit button before attempting to fill the title input.
- **Nav active state** — Workspace shell nav items now use `pathname.startsWith(href)` so nested routes correctly highlight the parent nav link.
- **`createProject` atomicity** — If the `project_members` insert fails after a project row is created, the orphan project row is now deleted before returning the error.
- **`renameProject` schema** — A dedicated `renameProjectSchema` replaces the wider `updateProjectSchema` in the rename action, narrowing the server action's contract.
- **Logo whitespace** — Fixed extra whitespace in the logo component.

### Removed

- **Legacy workflow statuses "Resolved" and "Closed"** — Deleted from the database via migration. Any issues previously on those statuses are automatically reassigned to **Done** before the rows are removed.

---

## [2.0.1] — 2026-04-12

### Added

- **Branded email templates** — Transactional emails (issue created, issue assigned) now use a professional HTML layout with the Ops Tracker logo, a highlighted issue title card, a CTA button, and a footer.
- **Issue list improvements** — Sortable columns, offset + cursor pagination, search by title/key, status and assignee filters.
- **Issue assignment** — Administrators can assign issues to project members. An email notification is sent via Resend.
- **Issue archiving** — Soft-delete (archive) support for issues.
- **Audit log (admin)** — Global audit log page with filters by action, entity type, and date range.
- **Audit indexes** — Additional Postgres indexes for audit log and issue list performance.
- **E2E test suite** — Playwright-based critical-path tests with CI integration.
- **i18n routing** — Locale-aware routing, auth redirects, and shared route constants across the app.
- **Supabase migration guide** — Developer documentation for running and writing migrations added to the repo.

### Changed

- **Email subjects** — Issue-assigned emails now use the subject line `"Assigned to you: <title>"` instead of `"Assigned: <title>"`.
- **App roles centralised** — Role constants and type guards extracted into a single shared module.

### Fixed

- **Resend email helpers hardened** — Added null-checks and error boundaries around email sending so a failed delivery never crashes a server action.
- **Admin dynamic imports** — Fixed missing `dynamic()` wrappers causing SSR errors in the admin area on certain routes.
- **Playwright CI config** — Fixed dev-server port and browser download skip flag for CI environments.
- **reCAPTCHA UX** — The login submit button is disabled until the reCAPTCHA script has finished loading, preventing silent token-less submissions.
- **Hydration mismatch** — The project-switcher `Select` in `WorkspaceShellClient` is now deferred until after mount, preventing Mantine `useId` counter divergence between SSR and the client.

---

## [2.0.0] — 2026-04-05

### Added

- **Full application rewrite** — Complete rebuild of the app as a production-grade Next.js 15 App Router project with Supabase, Mantine UI, and `next-intl`.
- **Supabase Phase 1 migrations** — Database schema for users, issues, issue statuses, and audit logs established via versioned migrations.
- **Role-based access control** — Three roles: `user`, `admin`, `super_admin`. RLS policies enforced at the database layer.
- **Issue tracking** — Create, read, and update issues with title, description, status, and reporter.
- **Issue status transitions** — Status select on issue detail; transitions recorded to the audit log.
- **Admin area** — User management (view/change roles), issue status management (CRUD with slug + sort order).
- **Super admin settings page** — Dedicated settings area restricted to `super_admin` role.
- **Per-issue audit trail** — Activity section on issue detail page (admin-only), showing recent actions for that issue.
- **Audit logging** — Every mutating action writes a row to `audit_logs` with actor, action, entity, and metadata.
- **TanStack Query data layer** — Client-side data fetching and caching via `@tanstack/react-query` with server actions as the transport.
- **Session management** — Session refresh via middleware proxy; logout action invalidates the Supabase session.
- **SEO** — `generateMetadata` on all route segments with per-locale titles and descriptions.

### Changed

- **Environment variable structure** — Consolidated and documented all required env vars; split public vs. server-only variables.

### Fixed

- **Node version and lockfile** — Raised minimum Node version and aligned `package-lock.json` with `npm ci`.

---

## [1.0.2] — 2026-02-24

### Added

- **Supabase integration** — Supabase client configured; project linked to a live Supabase instance.
- **Authentication** — Email/password login flow using Supabase Auth; session stored in cookies.
- **Theme switcher** — Light/dark mode toggle in the workspace header, persisted across page loads.

---

## [1.0.1] — 2026-02-22

### Added

- **Initial release** — Next.js 15 App Router project scaffolded with TypeScript, ESLint, and Prettier.
- **Multilingual support** — `next-intl` configured for English, German, and Slovenian with locale-prefixed routing.
- **CI workflow** — GitHub Actions pipeline for lint and build checks on every push.
- **Mantine UI** — Component library integrated with SSR-compatible colour scheme provider.
- **Landing page** — Public marketing page with app description and sign-in link.
