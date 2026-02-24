# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Install and integrate Supabase backend,
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
