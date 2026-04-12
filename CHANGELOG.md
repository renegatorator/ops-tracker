# Changelog

All notable changes to Ops Tracker are documented here.
Dates follow the **YYYY-MM-DD** format. Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added
- **Issue types** — Issues can now be classified as **Bug** or **Ticket** at creation time. A new `issue_type` column (Postgres enum) is stored on the `issues` table.
- **Create issue on board** — Administrators now see a **"New issue"** button directly on the project Kanban board, opening the create-issue modal without navigating away.
- **Assignee field in create modal** — The create-issue modal now includes an **Assignee** selector so issues can be assigned at creation time.
- **Description required for tickets** — When creating a Ticket (as opposed to a Bug), the description field is now **required** and the textarea is taller (6 rows min).
- **Workflow statuses** — Default statuses seeded via migration: **Open → In Progress → Ready for Deployment → Testing → Done**.
- **Professional landing page** — The home page was redesigned with logo, feature highlights grid, and two disabled demo buttons ("Demo as User", "Demo as Admin") marked as coming soon.
- **Branded email templates** — Transactional emails (issue created, issue assigned) now use a professional HTML layout with the Ops Tracker logo, a highlighted issue title card, a CTA button, and a footer.
- **Super admin: rename project** — Super admins can now rename an existing project from the project Settings page. The rename is guarded by a dedicated `renameProject` server action (super_admin role only) and recorded in the audit log.

### Changed
- **Issue detail page is now read-only by default** — Title and description are displayed as plain text. A pencil icon button reveals the edit form; a Cancel button reverts changes without saving.
- **Audit activity section** — The raw truncated JSON "Details" column was replaced with two meaningful columns: **Issue key** and **Summary** (e.g. "Updated: title, description", "Assigned to …", "Status → …"). Action labels are colour-coded badges.
- **Board column visibility (light theme)** — Kanban columns now use `gray-1` background with a visible border, matching the appearance of the dark theme.
- **Board column colour (dark theme)** — Column backgrounds now use `dark-6` (`#25262b`) instead of the too-bright `gray-1`, restoring the original subtle elevation over the dark body.
- **Email subjects** — Issue-assigned emails now use the subject line `"Assigned to you: <title>"` instead of `"Assigned: <title>"`.
- **Login page** — Removed the redundant "Sign in" heading and the inline email description hint (`"Use your email address (must include @)."`); the form is cleaner without them.

### Removed
- **Legacy workflow statuses "Resolved" and "Closed"** — Deleted from the database via migration (`20260413110000`). Any issues previously on those statuses are automatically reassigned to **Done** before the rows are removed.

---

## [0.4.0] — 2026-04-12

### Added
- **Project-scoped issues** — Issues belong to a project; each issue gets a human-readable key (e.g. `RKP-1`).
- **Kanban board** — Per-project drag-and-drop board powered by `@dnd-kit/core`. Dropping a card on a column triggers a status transition.
- **Project members & settings** — Admins can add/remove project members. A project settings page is available under the project sub-navigation.
- **Project sub-navigation** — Board / Issues / Settings tab strip under each project.
- **Project switcher** — Workspace header now includes a project quick-jump dropdown.
- **Dashboard** — Overview page showing active projects, open issues, and personal assignments.
- **Audit log (admin)** — Global audit log page with filters by action, entity type, and date range.

---

## [0.3.0] — 2026-04-11

### Added
- **Issue list improvements** — Sortable columns, offset + cursor pagination, search by title/key, status and assignee filters.
- **Issue assignment** — Administrators can assign issues to project members. An email notification is sent via Resend.
- **Issue archiving** — Soft-delete (archive) support for issues.
- **Audit indexes** — Additional Postgres indexes for audit log and issue list performance.

---

## [0.2.0] — 2026-04-05

### Added
- **Admin area** — User management (view/change roles), issue status management (CRUD with slug + sort order), and a super-admin settings page.
- **Role-based access control** — Three roles: `user`, `admin`, `super_admin`. RLS policies enforced at the database layer.
- **Issue status transitions** — Status select on issue detail; transitions recorded to the audit log.
- **Per-issue audit trail** — Activity section on issue detail page (admin-only), showing recent actions for that issue.

---

## [0.1.0] — 2026-04-03

### Added
- **Initial release** — Next.js 15 App Router project with Supabase (auth + database), Mantine UI, and `next-intl` for English, German, and Slovenian.
- **Issue tracking** — Create, read, and update issues with title, description, and status.
- **Issue statuses** — Configurable workflow statuses stored in `issue_statuses`.
- **Audit logging** — Every mutating action writes a row to `audit_logs` with actor, action, entity, and metadata.
- **Email notifications** — Resend integration for issue-created confirmation emails.
- **Multilingual support** — Full i18n for EN / DE / SI across all pages and error messages.
- **SEO** — `generateMetadata` on all route segments with per-locale titles and descriptions.
