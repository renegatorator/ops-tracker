# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Landing page component with gradient icon and login button
- Typography component with predefined text styles (heading-01 through caption-02)
- PagesLayout wrapper component for consistent page structure
- SCSS design system with centralized color tokens and CSS custom properties
- SCSS mixins for media queries, gradient text, animations, and utilities
- Tabler Icons React library for iconography
- Multilingual landing page content (en, si, de)
- Sass compilation support

### Changed

- Migrated from CSS to SCSS for styling
- Integrated Mantine UI with root layout (MantineProvider, ColorSchemeScript)
- Updated page component to use new LandingPage structure

### Removed

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
