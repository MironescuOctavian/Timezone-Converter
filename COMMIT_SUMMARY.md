<!-- Collects a human-readable summary of timezone-converter changes for preparing a Git commit. -->

# Suggested commit

`refactor: release Timezone Converter 0.0.5`

## Changes since the last commit

- Rename the package to `timezone-converter`, set version `0.0.5`, and update its description, keywords, homepage, issue tracker, and repository links.
- Rename the visible app branding and SEO titles to Timezone Converter while retaining author attribution and existing deployment settings.
- Align shared header, footer, and page widths and spacing.
- Move component layout, responsive behavior, hover/focus states, menus, and slider styling into shared UnoCSS shortcuts; retain CSS only for theme variables and animation keyframes.
- Fix missing production utility styles using typed UnoCSS per-module configuration and a semantic shortcut safelist.
- Complete missing UI translations across all ten locales, including settings, holidays, activity labels, distance, presence, privacy, geographic labels, and the 404 description.
- Use typed Rimelight translation lookups, localize city search results and accessibility labels, and use Rimelight's copy button in the Discord converter.
- Share bounded date formatters between clocks, calendars, timeline labels, conversion calculations, and clipboard formatting.
- Add public-holiday calendars to expanded World Clock details, with nationwide/regional distinction, selected-date highlighting, upcoming/full-year views, caching, and unavailable/error handling.
- Include the pending shared city timeline and activity helpers, with tests for time selection and work/free/sleep periods.
- Remove unused social UI, obsolete sidebar/slider stylesheets, write-only hover state, an unused weather description field, and the superseded full-source export artifact.
- Bound city information and gallery metadata caches to limit memory growth during long sessions while retaining lazy image loading and request cancellation.
- Clarify cache and build comments and document styling, localization, and verification conventions.
- Add formatter, holiday normalization/API, timeline, and translation coverage tests; strengthen localized-route checks and verify generated production CSS.

## Validation

- `vp check`: formatting, lint, and type checks.
- `vp test`: 38 tests across 11 files.
- `vp run build`: production client and Worker build.
- `vp node scripts/check-styles.mjs --build`: utility resolution and production CSS checks.
- `vp node scripts/check-locales.mjs`: both pages across ten locales, against a running development server.

Formatting, lint, types, all 38 tests, the production build, and production CSS checks passed after the latest metadata/cache cleanup. Localized-route checks passed during the preceding refactor and were not repeated for this metadata/cache-only pass. No browser interaction or visual verification was performed. No commits, pushes, or deployment were performed.
