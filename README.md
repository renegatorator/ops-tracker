# Ops Tracker

Ops Tracker is a modern operations & incident management dashboard built to demonstrate production-level frontend architecture and data workflows.

The application showcases authentication, role-based access control, large dataset handling, and admin-driven workflows using a modern full-stack setup.

---

## 🚀 Purpose

This project exists as a technical showcase to demonstrate:

- scalable Next.js App Router architecture
- authentication & role-based permissions
- server components & server actions
- large data handling with TanStack Table
- data fetching & caching with React Query
- admin CRUD workflows
- audit/activity tracking
- real-world SaaS dashboard patterns

---

## 🧱 Tech Stack

### Frontend

- Next.js (App Router)
- React
- TypeScript

### Backend & Infrastructure

- Supabase (PostgreSQL, Auth, RLS)
- Vercel (deployment)

### Data & State

- TanStack Table
- TanStack Query (React Query)
- Zod (server-side validation for domain actions)

### UI

- Mantine (component library)

### Email & Notifications

- Resend

---

## 🔐 Roles

The app demonstrates role-based access:

### User

- create & manage issues
- update statuses
- filter & search data

### Admin

- manage all issues
- assign issues
- manage users & statuses
- view audit logs

### Super Admin

- system configuration
- demo data reset
- role management

---

## ✨ Core Features

- Authentication & protected routes
- Role-based authorization
- Issues domain (server actions + RLS-backed CRUD, status transitions, admin assign/soft-delete; list at `/[locale]/issues`)
- Issue lifecycle workflow
- Large dataset filtering & sorting
- Activity & audit trail
- Admin dashboard
- Responsive & accessible UI
- Optimistic UI updates

---

## 📂 Project Structure

```
src/
  app/            # Next.js app router
  components/     # reusable UI components
  features/       # domain features (issues, users, admin); hooks colocated per feature
  lib/            # utilities & services
```

### Database (Supabase)

Auth-linked profiles use the **`user_profiles`** table and Postgres enum **`app_role`**. The rest of the schema (issues, audit, etc.) is defined in migrations as the app grows. Canonical details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); implementation order: [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md). **Apply migrations and manual DB steps:** [docs/SUPABASE_MIGRATIONS.md](docs/SUPABASE_MIGRATIONS.md). Quick CLI path from repo root: `npm run db:link` (once), then `npm run db:push` ([Supabase CLI](https://supabase.com/docs/guides/cli) via `npx`), or paste each file from `supabase/migrations/` into the dashboard SQL Editor in the order listed in that doc.

### Environment variables

| Variable | Scope | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client + server | Supabase project |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical site URL (emails, metadata); defaults to `http://localhost:3000` in code if unset |
| `RESEND_API_KEY` | **server only** | [Resend](https://resend.com) API key; when set, assignment and issue-created emails are attempted |
| `RESEND_FROM` | **server only** | Sender address (use a verified domain in production; Resend’s `onboarding@resend.dev` works for tests) |
| `OPS_DEMO_RESET_ENABLED` | **server only** | Super-admin demo reset gate; see `src/lib/env.ts` for default behaviour |
| `E2E_EMAIL`, `E2E_PASSWORD` | local / CI | Optional Playwright credentials; see **End-to-end tests** below |
| `PLAYWRIGHT_BASE_URL` | local / CI | Optional; Playwright defaults to `http://127.0.0.1:3000` |

See `.env.example` for a starter list.

### Roles for local development

Create a user (sign up in the app or via Supabase Auth), ensure **`user_profiles`** has a row for that user, then set **`app_role`** as needed (for example `super_admin` for full access). Step-by-step SQL is in [docs/SUPABASE_MIGRATIONS.md](docs/SUPABASE_MIGRATIONS.md).

### End-to-end tests (optional)

1. Install browsers once: `npx playwright install chromium`
2. Set **`E2E_EMAIL`** and **`E2E_PASSWORD`** in `.env.local` to a user that can sign in and already has at least one issue in the same Supabase project.
3. Run **`npm run test:e2e`** (Playwright can start `npm run dev` automatically, or reuse an existing server on `PLAYWRIGHT_BASE_URL`).

If `E2E_EMAIL` or `E2E_PASSWORD` is unset, the critical-path test **skips** so clones and CI stay green without secrets.

---

## 🛠 Development

### Install dependencies

```bash
npm install
```

### Run the dev server

```bash
npm run dev
```

Visit:

```
http://localhost:3000
```

---

## 👨‍💻 Author

**Rene Krajnc**  
Software Engineer  
Maribor, Slovenia

🌐 https://www.renekrajnc.com

---

## 📄 License

This project is for demonstration and portfolio purposes.
