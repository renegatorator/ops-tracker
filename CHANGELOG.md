# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Phase 4 issues domain: `src/features/issues/` with Zod schemas, Supabase service layer, server actions (`listIssues`, `createIssue`, `updateIssue`, `transitionIssueStatus`, `assignIssue`, `softDeleteIssue`), i18n error keys (`issues` namespace, en/si/de), `revalidatePath`/`revalidateTag` after mutations, opaque offset-based list cursor helpers colocated in `service.ts`
- Protected route `src/app/[locale]/issues/page.tsx` (signed-in issue list placeholder)
- `zod` dependency for issue input validation
- SEO metadata wiring for `/issues` in `src/utils/seoUtils.ts`
- Supabase CLI project layout: `supabase init` (`config.toml`, `.gitignore`); npm scripts `db:link`, `db:push`, `db:pull`, `db:diff`, `db:start`, `db:stop`, `db:reset` (CLI via `npx supabase@latest`)
- Phase 1 Supabase migration: `issue_statuses`, `issues`, `audit_log`, RLS, seed statuses; apply guide in `docs/SUPABASE_PHASE1.md`
- Typed `env()` helper in `src/lib/env.ts` for known `NEXT_PUBLIC_*` variables (autocomplete and missing-value errors)
- Phase 2 auth: refresh Supabase session in `src/proxy.ts` after next-intl (and on `/` → `/{locale}` redirect) via `src/lib/supabase/proxy.ts`
- Shared auth helpers in `src/lib/auth/session.ts` (`getSession`, `requireUser`, `requireRole`) and `signOutAction` in `src/lib/auth/actions.ts`
- Localized header **Log out** when signed in; dashboard protection uses `requireUser`

### Changed

- Supabase server and browser clients and root layout `metadataBase` now read public env vars through `env()`
- Documented optional `NEXT_PUBLIC_SITE_URL` in `.env.example`
- Phase 2 modules and related layout/dashboard components use const arrow exports where applicable

### Fixed

- Landing page login CTA: avoid passing `Link` as a Mantine `Button` `component` prop from a Server Component (Next.js client component prop serialization)

## [1.0.2] - 2026-02-24

### Added

- Install and integrate Supabase backend,
- Login page route and reusable login component with Supabase email/password sign-in
- Protected dashboard route that redirects unauthenticated users to login
- Localized login and dashboard translations (en, si, de), including localized auth error messages
- Theme toggle with system preference detection and manual override
- Language switcher with flag icons and accessible labels
- Professional copyright footer with translations
- Next-intl navigation helper for locale routing
- UI translations for theme and language controls (en, si, de)
- Landing page component with gradient icon and login button
- Typography component with predefined text styles (heading-01 through caption-02)
- PagesLayout wrapper component for consistent page structure
- SCSS design system with centralized color tokens and CSS custom properties
- SCSS mixins for media queries, gradient text, animations, and utilities
- Tabler Icons React library for iconography
- Multilingual landing page content (en, si, de)
- Sass compilation support
- classnames library for conditional className handling

### Changed

- Redirect login CTA on landing page to the login route
- Redirect successful sign-in to dashboard
- Converted landing page translations from client-side hook usage to server-side translations
- Integrated theme toggle and language switcher into PagesLayout header
- Migrated from CSS to SCSS for styling
- Integrated Mantine UI with root layout (MantineProvider, ColorSchemeScript)
- Updated page component to use new LandingPage structure
- Updated ESLint config to allow setState in useEffect for hydration fixes
- Replaced template literal className usage with classnames library

### Fixed

- Hydration mismatch in theme toggle with mount state pattern

### Removed

- Unused Geist font variables from layout
- Dark color-scheme media query override from global styles
- Old Next.js placeholder page styles (page.module.css)
- Duplicate globals.css file (replaced with globals.scss)

## [1.0.1] - 2026-02-21

### Added

- added eslint, typescript and i18n configurations,
- added changelog,
- added Mantine UI

### Changed

- updated dependencies,
- configured i18n support

### Fixed
