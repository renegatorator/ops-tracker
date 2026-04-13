# Ops Tracker

Ops Tracker is a full-stack project management and issue tracking application — a Jira-like tool built to demonstrate production-level frontend architecture with a real Supabase backend.

The application covers authentication, role-based access control, Kanban boards, project scoping, audit trails, transactional email, and internationalisation across three languages.

---

## Purpose

This project exists as a technical showcase demonstrating:

- scalable Next.js App Router architecture (server components, server actions, layouts)
- authentication & role-based access control (Supabase Auth + RLS + Postgres enum roles)
- Kanban board with drag-and-drop (`@dnd-kit`)
- project-scoped issues with human-readable keys (e.g. `RKP-1`)
- large dataset handling with virtual scrolling and TanStack Table
- data fetching & caching with React Query
- full audit trail recorded to Postgres
- transactional email via Resend with branded HTML templates
- reCAPTCHA v3 bot protection on login
- multilingual support (English / German / Slovenian) via next-intl

---

## Tech Stack

### Frontend

- **Next.js 16** (App Router, server actions, proxy middleware)
- **React 19**
- **TypeScript**
- **Mantine 8** (component library)
- **SCSS modules** (custom styles, design tokens)
- **@tabler/icons-react** (icons)

### Drag & Drop

- **@dnd-kit/core** — Kanban board drag-and-drop

### Data & State

- **TanStack Table** — virtualized issues list
- **TanStack Query (React Query)** — client-side data fetching & caching
- **Zod** — schema validation for all server actions

### Backend & Infrastructure

- **Supabase** (PostgreSQL, Auth, Row Level Security)
- **Vercel** (deployment target)

### Email & Notifications

- **Resend** — transactional email (issue created, issue assigned)

### Security

- **Google reCAPTCHA v3** — bot protection on the login form (optional; gracefully disabled when unconfigured)

### Testing

- **Playwright** — end-to-end critical-path tests

---

## Roles

The app implements three roles stored in `user_profiles.role` (Postgres enum `app_role`):

### User

- View and search all issues
- Update status on issues they reported or are assigned to
- View their own assignments on the dashboard

### Admin

- All user capabilities
- Create issues (on project board or project issues page)
- Assign issues to team members
- Manage project members and settings
- View audit log on each issue and the global admin audit log
- Manage issue statuses

### Super Admin

- All admin capabilities
- Rename existing projects
- System configuration flags
- Demo data reset
- Role management for other users

---

## Core Features

### Projects & Kanban

- Create projects with unique keys (e.g. `OPS`, `RKP`)
- Drag-and-drop Kanban board per project, columns driven by workflow statuses
- Project sub-navigation: Board / Issues / Settings

### Issues

- Issue types: **Bug** or **Ticket**
- Human-readable issue keys (e.g. `RKP-1`)
- Description required for tickets, optional for bugs
- Status transitions (Open → In Progress → Ready for Deployment → Testing → Done)
- Assignee management
- Soft delete (archive)
- Issue detail page: read-only by default, pencil button unlocks editing

### Dashboard

- Overview of active projects, open issues, personal assignments

### Admin Area (`/admin`)

- User list with role management
- Issue status CRUD (name, slug, sort order, terminal flag)
- Global audit log with filters
- Super-admin settings & demo reset

### Audit Trail

- Every mutating action (create, update, assign, status transition, archive) is logged to `audit_logs`
- Per-issue activity section (admin only) with colour-coded action badges, issue key, and meaningful summary

### Email Notifications

- Issue created → confirmation email to reporter
- Issue assigned → notification email to assignee
- Branded HTML templates with logo, highlighted title card, CTA button, and footer

### Internationalisation

- English (default, no URL prefix), German (`/de/…`), Slovenian (`/si/…`)
- All UI strings, validation messages, and error text localised

---

## Project Structure

```
src/
  app/            # Next.js App Router — layouts, pages, loading states
  components/     # Shared UI components (Layout, Pages, Typography, skeletons)
  features/       # Domain features, each with components, hooks, actions, service, types
    admin/
    audit/
    dashboard/
    issues/
    projects/
    settings/
  i18n/           # next-intl routing and navigation helpers
  lib/            # Utilities and services (auth, email, recaptcha, Supabase, env)
  translations/   # en.json, de.json, si.json
  styles/         # Global SCSS variables, mixins, theme tokens
```

### Database (Supabase)

Auth-linked profiles use the **`user_profiles`** table and Postgres enum **`app_role`**. All other schema (issues, projects, project members, audit logs, issue statuses) is defined in numbered migrations under `supabase/migrations/`. See:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — data model and RLS design
- [docs/SUPABASE_MIGRATIONS.md](docs/SUPABASE_MIGRATIONS.md) — apply order and manual steps

**Quick start with CLI:**

```bash
npm run db:link   # link repo to your Supabase project (once)
npm run db:push   # apply all pending migrations
```

Or paste each file from `supabase/migrations/` into the **Supabase SQL Editor** in filename order.

---

## Environment Variables

| Variable                               | Scope           | Purpose                                                                                       |
| -------------------------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | client + server | Supabase project URL                                                                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client + server | Supabase anon/publishable key                                                                 |
| `SUPABASE_DB_PASSWORD`                 | CLI only        | Postgres password for `db:push` / `db:pull`                                                   |
| `NEXT_PUBLIC_SITE_URL`                 | public          | Canonical site URL used in emails and metadata. Defaults to `http://localhost:3000`           |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`       | client          | reCAPTCHA v3 site key (public). When unset, reCAPTCHA is skipped.                             |
| `RECAPTCHA_SECRET_KEY`                 | **server only** | reCAPTCHA v3 secret key — never expose publicly                                               |
| `RESEND_API_KEY`                       | **server only** | [Resend](https://resend.com) API key for transactional email                                  |
| `RESEND_FROM`                          | **server only** | Sender address (e.g. `Ops Tracker <mail@yourdomain.com>`). Defaults to Resend's test address. |
| `OPS_DEMO_RESET_ENABLED`               | **server only** | Enables super-admin demo data reset. Defaults to `true` outside production.                   |
| `E2E_EMAIL`, `E2E_PASSWORD`            | local / CI      | Playwright test credentials                                                                   |
| `PLAYWRIGHT_BASE_URL`                  | local / CI      | Playwright base URL. Defaults to `http://127.0.0.1:3000`.                                     |

Copy `.env.example` to `.env.local` and fill in the required values.

### Setting up reCAPTCHA v3

1. Go to [https://www.google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)
2. Register a new site, choose **Score based (v3)**
3. Add your domain (use `localhost` for local testing)
4. Copy the **Site key** → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
5. Copy the **Secret key** → `RECAPTCHA_SECRET_KEY`

When neither variable is set the login form works normally — useful for local development.

---

## Local Development

### Prerequisites

- Node.js ≥ 20.19.0
- A Supabase project with migrations applied (see above)

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Roles for local development

Create a user via the app login or Supabase Auth dashboard, ensure a matching row exists in `user_profiles`, then set `app_role` to `super_admin` for full access. Step-by-step SQL is in [docs/SUPABASE_MIGRATIONS.md](docs/SUPABASE_MIGRATIONS.md).

---

## Architecture Notes

### Next.js 16 proxy (auth + locales)

Session refresh and `next-intl` routing run from **`src/proxy.ts`** (shown as **Proxy (Middleware)** in `next build`). Do **not** add a separate `src/middleware.ts` — Next.js 16 errors if both exist.

### URL locales

Routing uses `localePrefix: "as-needed"`: **English** URLs are unprefixed (`/issues`, `/dashboard`). **German** and **Slovenian** use prefixes: `/de/issues`, `/si/issues`. Always use `Link` and `redirect` from `@/i18n/navigation`.

### Admin area

Routes under `/admin` require `user_profiles.role` of `admin` or `super_admin`. Visiting `/admin` as a regular user redirects to `/dashboard`.

---

## End-to-End Tests

1. Install browsers once: `npx playwright install chromium`
2. Set `E2E_EMAIL` and `E2E_PASSWORD` in `.env.local`
3. Run: `npm run test:e2e`

If `E2E_EMAIL` or `E2E_PASSWORD` is unset, the critical-path spec **skips** automatically so CI stays green without secrets.

---

## Author

**Rene Krajnc**
Senior React/Next.js Developer — Maribor, Slovenia
[https://www.renekrajnc.com](https://www.renekrajnc.com)

---

## License

This project is for demonstration and portfolio purposes.
