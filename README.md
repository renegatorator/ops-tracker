# 🗂️ Ops Tracker

> A full-stack project management and issue tracking application — a Jira-like tool built to demonstrate production-level frontend architecture with a real Supabase backend.

[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![Mantine](https://img.shields.io/badge/Mantine-8.3.15-339af0)](https://mantine.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)](https://supabase.com/)
[![Portfolio](https://img.shields.io/badge/project-portfolio%20demo-orange)](https://www.renekrajnc.com)

---

## ✨ Features

### 🔐 **Authentication & Role-Based Access**

- Supabase Auth with session management via server-side cookies
- Three-tier role system (`user`, `admin`, `super_admin`) stored as Postgres enum
- Row Level Security on all tables; routes under `/admin` redirect non-admins
- reCAPTCHA v3 bot protection on login (gracefully disabled when unconfigured)

### 📋 **Projects & Kanban Board**

- Create projects with unique human-readable keys (e.g. `OPS`, `RKP`)
- Drag-and-drop Kanban board per project powered by `@dnd-kit`
- Columns driven by configurable workflow statuses (admin CRUD for statuses)
- Project sub-navigation: Board / Issues / Settings

### 🐛 **Issue Management**

- Issue types: Bug or Ticket
- Human-readable issue keys (e.g. `RKP-1`)
- Description required for tickets, optional for bugs
- Status transitions (Open → In Progress → Ready for Deployment → Testing → Done)
- Assignee management, soft delete (archive)
- Issue detail page: read-only by default, pencil button unlocks editing

### 📊 **Large Dataset Handling**

- Virtualized issues list using TanStack Table + TanStack Virtual
- Offset-based pagination with TanStack Query caching

### 🧾 **Audit Trail**

- Every mutating action (create, update, assign, status transition, archive) logged to `audit_logs`
- Per-issue activity section (admin only) with colour-coded action badges and meaningful summaries
- Global admin audit log with filters

### 📧 **Email Notifications**

- Issue created → confirmation email to reporter
- Issue assigned → notification email to assignee
- Branded HTML templates via Resend with logo, highlighted title card, CTA button, and footer

### 🌍 **Internationalisation**

- English (default, no URL prefix), German (`/de/…`), Slovenian (`/si/…`)
- All UI strings, validation messages, and error text localised via next-intl

### 🛠️ **Developer Experience**

- TypeScript strict mode throughout
- ESLint 9 (flat config) with import-sort and unused-imports plugins
- SCSS modules with design tokens and centralized responsive mixins
- Zod schema validation on all server actions

---

## 🏗️ Tech Stack

### **Core**

- **Framework:** [Next.js 16.2.3](https://nextjs.org/) (App Router, server actions, proxy middleware)
- **React:** 19.2.3
- **TypeScript:** 5.9.3
- **Styling:** SCSS Modules + [Mantine 8](https://mantine.dev/) component library
- **Icons:** [@tabler/icons-react](https://tabler-icons.io/)

### **Drag & Drop**

- [@dnd-kit/core](https://dndkit.com/) — Kanban board drag-and-drop

### **Data & State**

- **[TanStack Query v5](https://tanstack.com/query/latest)** — client-side data fetching & caching
- **[TanStack Table v8](https://tanstack.com/table/latest)** — virtualized issues list
- **[TanStack Virtual v3](https://tanstack.com/virtual/latest)** — row virtualisation
- **[Zod](https://zod.dev/)** — schema validation for all server actions

### **Backend & Infrastructure**

- **[Supabase](https://supabase.com/)** (PostgreSQL, Auth, Row Level Security)
- **[Vercel](https://vercel.com/)** (deployment target)

### **Email & Security**

- **[Resend](https://resend.com/)** — transactional email (issue created, issue assigned)
- **Google reCAPTCHA v3** — bot protection on the login form

### **Testing**

- **[Playwright](https://playwright.dev/)** — end-to-end critical-path tests

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 20.19.0
- A Supabase project with migrations applied (see [docs/SUPABASE_MIGRATIONS.md](docs/SUPABASE_MIGRATIONS.md))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ops-tracker.git
cd ops-tracker

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in required values — see Environment Variables below
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For full access, set your Supabase user's `app_role` to `super_admin` — step-by-step SQL is in [docs/SUPABASE_MIGRATIONS.md](docs/SUPABASE_MIGRATIONS.md).

---

## 📦 Available Scripts

```bash
# Development
npm run dev           # Start dev server with hot reload

# Production
npm run build         # Build for production
npm run start         # Start production server

# Code Quality
npm run lint          # Run ESLint
npm run tsc           # TypeScript type checking

# Database (Supabase CLI)
npm run db:link       # Link repo to your Supabase project (once)
npm run db:push       # Apply all pending migrations
npm run db:pull       # Pull remote schema changes
npm run db:diff       # Diff local vs remote schema
npm run db:start      # Start local Supabase stack
npm run db:stop       # Stop local Supabase stack
npm run db:reset      # Reset local database

# End-to-End Tests
npm run test:e2e      # Run Playwright tests
npm run test:e2e:ui   # Run Playwright tests with UI
```

---

## 🗂️ Project Structure

```
ops-tracker/
├── docs/                     # Architecture docs and migration guides
│   ├── ARCHITECTURE.md
│   └── SUPABASE_MIGRATIONS.md
├── supabase/
│   └── migrations/           # Numbered SQL migration files
├── src/
│   ├── app/                  # Next.js App Router — layouts, pages, loading states
│   ├── components/           # Shared UI (Layout, Typography, skeletons)
│   ├── features/             # Domain features (components, hooks, actions, service, types)
│   │   ├── admin/
│   │   ├── audit/
│   │   ├── dashboard/
│   │   ├── issues/
│   │   ├── projects/
│   │   └── settings/
│   ├── i18n/                 # next-intl routing and navigation helpers
│   ├── lib/                  # Auth, email, reCAPTCHA, Supabase client, env
│   ├── translations/         # en.json, de.json, si.json
│   └── styles/               # Global SCSS variables, mixins, theme tokens
├── .env.example
├── next.config.ts
└── tsconfig.json
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client + server | Supabase anon/publishable key |
| `SUPABASE_DB_PASSWORD` | CLI only | Postgres password for `db:push` / `db:pull` |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical site URL used in emails and metadata. Defaults to `http://localhost:3000` |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | client | reCAPTCHA v3 site key (public). When unset, reCAPTCHA is skipped. |
| `RECAPTCHA_SECRET_KEY` | **server only** | reCAPTCHA v3 secret key — never expose publicly |
| `RESEND_API_KEY` | **server only** | [Resend](https://resend.com) API key for transactional email |
| `RESEND_FROM` | **server only** | Sender address (e.g. `Ops Tracker <mail@yourdomain.com>`). Defaults to Resend's test address. |
| `OPS_DEMO_RESET_ENABLED` | **server only** | Enables super-admin demo data reset. Defaults to `true` outside production. |
| `E2E_EMAIL`, `E2E_PASSWORD` | local / CI | Playwright test credentials |
| `PLAYWRIGHT_BASE_URL` | local / CI | Playwright base URL. Defaults to `http://127.0.0.1:3000`. |

### Setting up reCAPTCHA v3

1. Go to [https://www.google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)
2. Register a new site, choose **Score based (v3)**
3. Add your domain (use `localhost` for local testing)
4. Copy the **Site key** → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
5. Copy the **Secret key** → `RECAPTCHA_SECRET_KEY`

When neither variable is set the login form works normally — useful for local development.

---

## 🗄️ Database & Migrations

Schema is defined in numbered migration files under `supabase/migrations/`. Two ways to apply them:

**Supabase CLI (recommended):**

```bash
npm run db:link   # link repo to your Supabase project (once)
npm run db:push   # apply all pending migrations
```

**Manual (SQL Editor):** paste each file from `supabase/migrations/` into the Supabase SQL Editor in filename order.

Auth-linked profiles use the `user_profiles` table and the `app_role` Postgres enum. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full data model and RLS design, and [docs/SUPABASE_MIGRATIONS.md](docs/SUPABASE_MIGRATIONS.md) for step-by-step setup including the super-admin SQL.

---

## 🏛️ Architecture Notes

### Next.js 16 proxy (auth + locales)

Session refresh and `next-intl` routing run from `src/proxy.ts` (shown as **Proxy (Middleware)** in `next build`). Do **not** add a separate `src/middleware.ts` — Next.js 16 errors if both exist.

### URL locales

Routing uses `localePrefix: "as-needed"`: **English** URLs are unprefixed (`/issues`, `/dashboard`). **German** and **Slovenian** use prefixes: `/de/issues`, `/si/issues`. Always use `Link` and `redirect` from `@/i18n/navigation`.

### Admin area

Routes under `/admin` require `user_profiles.role` of `admin` or `super_admin`. Visiting `/admin` as a regular user redirects to `/dashboard`.

---

## 👥 Roles

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

## 🧪 End-to-End Tests

1. Install browsers once: `npx playwright install chromium`
2. Set `E2E_EMAIL` and `E2E_PASSWORD` in `.env.local`
3. Run: `npm run test:e2e`

If `E2E_EMAIL` or `E2E_PASSWORD` is unset, the critical-path spec skips automatically so CI stays green without secrets.

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Configure environment variables
4. Deploy automatically on push to main

---

## 👤 Author

**Rene Krajnc**
Senior React/Next.js Developer — Maribor, Slovenia
[https://www.renekrajnc.com](https://www.renekrajnc.com)

---

<p align="center">Made with ❤️ by Rene Krajnc</p>
