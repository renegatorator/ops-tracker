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
  features/       # domain features (issues, users, admin)
  lib/            # utilities & services
  hooks/          # custom React hooks
```

### Database (Supabase)

Auth-linked profiles use the **`user_profiles`** table and Postgres enum **`app_role`**. The rest of the schema (issues, audit, etc.) is defined in migrations as the app grows. Canonical details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); implementation order: [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md). **Apply migrations:** from the repo root, `npm run db:link` (once), then `npm run db:push` ([Supabase CLI](https://supabase.com/docs/guides/cli) via `npx`), or paste `supabase/migrations/*.sql` into the dashboard SQL Editor.

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
