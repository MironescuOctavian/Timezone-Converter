<!-- Records performance work, measurements, verification results, and remaining limitations. -->

# Performance work — 7 November 2026

## Implemented

- Restored production hydration by sharing Vite plugin state between client and Worker builds. Production HTML now references the hashed client entry instead of the development manifest.
- Changed UnoCSS from per-module to chunk generation, retaining the responsive/header/footer safelist. Global generation was tested and rejected because it left unresolved CSS placeholders.
- Split country outline geometry from the small city/country metadata. Direct World Clock navigation no longer requests the home/globe geometry bundle.
- Lazy-loaded the Discord converter. Its JavaScript is absent on initial home navigation and requested after selecting Discord; format controls render successfully.
- Reused clock text nodes across ticks. Added offscreen marquee suspension and hidden-document clock/background suspension with immediate clock refresh on return.
- Coalesced public JSON requests, independently handled consumer cancellation, and bounded successful-response caching to 128 URLs for ten minutes. Failed responses are retryable. Private location requests remain uncached.
- Aligned city/distance geocoding request parameters so identical requests can share work. Empty weather/Wikipedia results are no longer retained in the component cache.
- Removed unused serif font generation, retained sans/mono, and corrected production font URLs. Four local WOFF2 assets and their licenses are included. Images decode asynchronously.
- Cleared globe drag state when pointer capture is lost, preserving the interaction-only background pause behavior.

## Measurements and checks

Local production preview, Electron/Chrome 152, 1280 × 800. Resource Timing transfer sizes below are uncompressed localhost responses, not estimates of Cloudflare-compressed network cost.

- Initial home CSS before chunk generation: 3,241,831 bytes across 8 requests.
- Final home CSS: 1,159,106 bytes across 12 requests (about 64% fewer bytes; request count increased).
- Shared CityInfo JavaScript build chunk: approximately 152 kB before geometry separation, 50.81 kB after. Geometry moved to the home route; it was not deleted.
- Confirmed running hydrated clocks, globe canvas, lazy Discord loading, retained clock DOM nodes, and successful HTTP 200 responses for requested local fonts.
- `vp check`: formatting, lint and type checks pass.
- `vp test`: 44 tests pass across 14 files, including request sharing/cancellation/retry and country metadata alignment.
- `vp run build`: passes.
- `vp node scripts/check-styles.mjs --build`: 678 utility/state checks and production selector checks pass.
- Production locale smoke checks: all ten locales on both pages return 200 without detected streamed SSR errors and contain expected translated content.

## Limits and next targets

The preview remained non-visible and a fresh native IntersectionObserver did not deliver callbacks. Offscreen suspension is implemented, but its visual lifecycle and any FPS gain need confirmation in a visible browser. No new FPS claim is made from that environment.

UnoCSS still repeats theme preflights between chunks; roughly 1.16 MB of initial uncompressed CSS remains. Removing that duplication at the upstream integration layer is the next substantial opportunity. Compare compressed cold-load transfers on deployed Cloudflare before drawing conclusions about real-user load times. External image/weather/Wikipedia latency and device GPU speed remain variable.

## Files changed in this optimization pass

- `vite.config.ts`: shared build state, chunk CSS, unused-font removal and public font URLs.
- `src/components/app/SiteBackground.tsx`: suspend background work while the document is hidden.
- `src/components/timezone/Clock.tsx`: retain clock part DOM nodes.
- `src/components/timezone/WorldClocks.tsx`: suspend offscreen marquee work.
- `src/components/timezone/Converter.tsx`: load Discord on demand with a local loading fallback.
- `src/components/timezone/CityInfo.tsx`: shared public fetching and successful-result caching.
- `src/components/timezone/Distance.tsx`: share representative-city geocoding requests.
- `src/components/timezone/PhotoGallery.tsx`: asynchronous image decoding.
- `src/components/timezone/CountryCard.tsx`: asynchronous flag decoding.
- `src/components/timezone/fetch-json.ts`: bounded public request sharing/cache with cancellation.
- `src/components/timezone/fetch-json.test.ts`: sharing, cancellation, cache and retry coverage.
- `src/components/timezone/geography.ts`: isolate geometry-only data and helpers.
- `src/components/timezone/data.ts`: use small country metadata rather than geometry.
- `src/components/timezone/data.test.ts`: validate metadata/geometry alignment.
- `src/components/timezone/CanvasCountries.tsx`: import geometry from its isolated module.
- `src/components/timezone/TexturedCountries.tsx`: import geometry from its isolated module.
- `src/components/timezone/globe-texture.ts`: import geometry from its isolated module.
- `src/data/map-countries.json`: ordered country metadata without coordinates.
- `src/data/README.md`: document metadata provenance and ordering.
- `src/routes/[locale]/(app)/index.tsx`: geometry import, hidden-tab timer and lost-capture cleanup.
- `src/routes/[locale]/(app)/world-clock.tsx`: hidden-tab timer suspension and immediate return refresh.
- `public/assets/fonts/*.woff2` (four files): serve the existing sans/mono font subsets locally.
- `public/assets/fonts/*-LICENSE.txt` (two files): retain font license notices.
- `README.md`: update production CSS/build integration notes.
- `GLOBE_BENCHMARK.md`: mark the production hydration blocker resolved.
- `PERFORMANCE.md`: record implementation, measurements and verification limits.

Other pre-existing uncommitted changes were preserved. Nothing was committed or deployed.
