# Timezone Converter

A free, ad-free timezone converter and world clock by [Mironescu Octavian](https://octavianmironescu.com). Compare local times, explore an interactive globe, create Discord timestamps, and learn about cities around the world.

Built with Solid 2, TypeScript, Rimelight, UnoCSS, and Cloudflare Workers.

The globe starts as a static preview. **Enable interactive globe** loads its renderer, geometry and textures and starts the regional presence connection. Activation stays in document memory while navigating between pages; a fresh document starts disabled again. Converter and country search remain available before activation. Enabling the globe does not change regional-sharing consent.

The converted-time result includes a site-wide conversion total. It counts valid regular conversions after visitor edits settle, excluding initial page loads and clock ticks. Only an aggregate integer is persisted in the `ConversionCounter` Durable Object; dates, timezones and visitor identifiers are not sent to the counter. Totals begin when tracking is deployed and do not include unrecorded historical conversions. The `CONVERSION_COUNTER` binding and export are defined in `cloudflare.config.ts`; deploy the updated Worker to activate them. Public total reads may be cached for 15 seconds.

## Features

- **Timezone conversion:** second-level date and time controls, searchable cities, continent-grouped timezone menus, flags, clipboard copying, and Google Calendar event drafts. Starts with your timezone and Bucharest, Romania as the destination.
- **Discord timestamps:** copyable timestamp formats with previews in your local timezone.
- **Interactive globe:** drag to rotate in any direction, zoom up to 400%, explore countries, compare time differences, and jump directly to conversion. Continent and ocean labels appear at the initial zoom; ocean labels remain visible when zoomed in.
- **World Clock:** live times for featured destinations and your timezone, searchable additional cities, local dates, UTC offsets, and expandable city details.
- **Public holidays:** lazy-loaded country calendars in expanded World Clock details, selected-date highlighting, upcoming/full-year views, and separate nationwide/regional coverage. Dates come from the Nager.Date v4 API through a cached same-origin endpoint; no API key is required. Coverage is a planning aid, not a guarantee of time off.
- **City details:** current weather, photographs with a gallery, Wikipedia summaries, and approximate straight-line distance with kilometre/mile controls. World Clock details also include daylight information and clock-change dates where applicable.
- **Optional regional presence:** consent-based broad regional clusters, minimum group sizes and batched connection ranges, with an immediate stop-sharing control.
- **Appearance:** light, dark, and system themes; an animated cartographic background; section navigation; and reduced-motion support.
- **Localization:** English by default, plus Romanian, Portuguese, Arabic, German, Spanish, French, Hindi, Russian, and Chinese. English, Romanian, and Portuguese appear first in the language menu.

## Run locally

Use the versions recorded in `.node-version` and `package.json`: Node.js **26.13.0** and pnpm **12.16.1**. Install [Vite+](https://viteplus.dev/guide/) to use the `vp` commands below.

From the project directory:

```sh
vp install
vp run dev
```

Open [http://localhost:5173/en/](http://localhost:5173/en/). The World Clock is at [http://localhost:5173/en/world-clock](http://localhost:5173/en/world-clock).

Cloudflare's Vite plugin runs the Worker locally. Core conversion does not require a weather API key. Weather, search, photos, and live presence require network access; the interface handles unavailable data.

`.dev.vars.example` contains optional local security/Turnstile settings inherited from the site setup. Add local values in `.dev.vars` when using those features. Keep credentials out of source control.

## Commands

| Command                                    | Purpose                                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `vp install`                               | Install project dependencies                                                                                |
| `vp run dev`                               | Start the development server                                                                                |
| `vp run build`                             | Build the client and Cloudflare Worker                                                                      |
| `vp run preview`                           | Preview the production build                                                                                |
| `vp run generate-types`                    | Regenerate Cloudflare binding types                                                                         |
| `vp test`                                  | Run the test suite                                                                                          |
| `vp check`                                 | Check formatting, lint, and types through Vite+                                                             |
| `vp run check`                             | Run the package script: dependency audit, type generation, and `vp check --fix`; this can change formatting |
| `vp node scripts/check-locales.mjs`        | Check both pages in all ten languages against an existing dev server                                        |
| `vp node scripts/check-styles.mjs --build` | Verify UnoCSS utilities and the generated production stylesheet after building                              |
| `vp run deploy`                            | Build and deploy through the Cloudflare CLI                                                                 |

Vite+ built-in commands and package scripts are distinct. Use `vp run <name>` for the scripts defined in `package.json`.

## Deploy to Cloudflare

This is a **Cloudflare Workers** application with static assets and Durable Objects. `cloudflare.config.ts` is the source of deployment configuration; `src/fetch.ts` is the Worker entry point.

The Worker name is **`timezone-converter`**. The `workerName` constant is also used by the `GLOBE_PRESENCE` binding, so both references stay aligned. When deploying to another Worker, update that constant to match its exact Cloudflare dashboard name.

### Local deployment

Authenticate the Cloudflare CLI with the account containing the Worker, then run:

```sh
pnpm exec cf auth login
vp run deploy
```

To reuse a build you have already created:

```sh
vp run build
pnpm exec cf deploy --prebuilt
```

## Live presence and privacy

Presence follows the architecture of [Cloudflare's multiplayer globe template](https://github.com/cloudflare/templates/tree/main/multiplayer-globe-template). A single Durable Object coordinates WebSocket connections, using Cloudflare's native hibernation support without a separate PartyKit service.

- `/api/presence?v=2` accepts same-origin, rate-limited WebSocket connections. Location sharing is off unless `share=1` is explicitly chosen; old preferences do not grant consent under the new policy.
- Only Cloudflare's estimated continent is read for opted-in connections. The presence object receives an optional broad region code, never a city, timezone, visitor coordinates, IP address or copied request headers. Map positions are fixed region centres.
- A region appears only with at least five opted-in connections. Regional and global counts use ranges in groups of five, not exact values. These are connections, not verified unique people; thresholds reduce exposure but do not guarantee anonymity.
- Durable Object alarms publish arrivals and ordinary departures about every 25 seconds. New viewers receive the last published batch rather than a fresh arrival count.
- **Stop sharing my region** clears the connection's region immediately when received by the server and reduces/removes published clusters without revealing pending arrivals. Other tabs follow the saved preference. Browsing the map remains possible without sharing.
- Connection attachments hold only the optional region. One overwritten aggregate snapshot is retained while connections remain; it and the alarm are deleted after the last connection closes. No visit/event history is kept. Legacy city-based attachments are scrubbed and their connections closed on upgrade.
- Production automatic request logs, tracing, issues and Logpush are disabled in `cloudflare.config.ts` to reduce retained request metadata. This reduces diagnostic visibility. Account-level security logs, live tails and external exports must be reviewed separately in Cloudflare; repository settings cannot erase existing platform logs.
- `/api/location` privately returns the viewer's coarsened location for distance estimates with `Cache-Control: private, no-store`. A representative timezone city may be used as a clearly approximate fallback.

Theme preference is stored in a cookie; distance units and optional regional-sharing consent can be stored in local storage. Clipboard operations happen only when requested. External weather, search, flag, and image providers receive normal browser requests. The in-app privacy policy describes these features.

## Data sources and limits

| Data                                                 | Source                                           |
| ---------------------------------------------------- | ------------------------------------------------ |
| Timezones, formatting, and clock-change calculations | Browser/runtime `Intl` timezone database         |
| Country outlines                                     | Natural Earth through `world-atlas` and TopoJSON |
| Representative country/timezone metadata             | Bundled data under `src/data`                    |
| City search, weather, sunrise, and sunset            | [Open-Meteo](https://open-meteo.com/)            |
| City summaries and photographs                       | Wikipedia and Wikimedia APIs                     |
| Flags                                                | [FlagCDN](https://flagcdn.com/)                  |
| Approximate visitor locations                        | Cloudflare request metadata                      |
| Nationwide and regional public holidays              | [Nager.Date](https://nagerholidays.com/)         |

Country outlines are simplified and do not depict current sea ice. The North Pole is ocean, while Antarctica is included as land. The 24 longitude bands are a visual guide, not legal timezone boundaries. Many countries span several timezones; the globe selects a representative city.

Distances are great-circle estimates, not driving distances or precise hometown measurements. Weather and city information depend on provider availability. Gallery metadata is fetched on demand and cached briefly; image attribution links are available in the gallery. Preserve the relevant data and image licenses when reusing assets.

## Project structure

```text
cloudflare.config.ts           Worker name, exports, and bindings
vite.config.ts                 Vite+, Solid, Rimelight, and security configuration
src/fetch.ts                   Hono middleware, location API, and WebSocket routing
src/routes/[locale]/(app).tsx   Shared header, footer, providers, and background
src/routes/[locale]/(app)/     Converter, World Clock, and privacy-policy pages
src/components/app/            Navigation, settings menus, and background artwork
src/components/timezone/       Conversion, globe, clocks, city details, and tests
src/presence/                  Durable Object, presence protocol, and privacy tests
src/data/                      Country and timezone metadata
src/i18n/                      Locale dictionaries
src/styles/shortcuts.ts         Shared UnoCSS utilities for layout, states, and responsive behavior
scripts/check-locales.mjs      Localized-route smoke checks
```

Keep display translations separate from timezone identifiers. `city-names.ts` formats city names for the UI; IANA identifiers such as `America/New_York` remain unchanged in conversion logic.

Use Rimelight components and its UnoCSS preset for UI work. Ordinary component styles live in `src/styles/shortcuts.ts`; CSS files contain only theme variables and animation keyframes. UnoCSS uses chunk-based generation to avoid duplicated per-module preflights; global mode leaves unresolved placeholders in this Vite+/Cloudflare setup. Semantic shortcuts are safelisted for templates compiled before extraction. Keep `builder.sharedPlugins` enabled: it preserves the production client manifest across client and Worker builds.

Static UI text uses Rimelight's typed `t("key")` lookup. Add each new key to all ten dictionaries; `scripts/i18n.test.mjs` checks coverage, including continent and ocean labels. Dynamic city and provider holiday names retain explicit fallbacks. Wikipedia extracts and provider-supplied holiday names can remain in their source language.

## Verification and troubleshooting

Run `vp test`, `vp check`, and `vp run build` before deployment. Tests cover conversion boundaries, Discord formatting, clock changes, geographic labels, distances, and anonymous presence data.

With a dev server running, `vp node scripts/check-locales.mjs` checks the converter and World Clock in all ten languages. It detects streamed SSR exceptions even when the response status is 200. Set `LOCALE_CHECK_URL` to check another server.

### Worker not found during deployment

If deployment reports that a Worker was not found, check the exact dashboard name and active Cloudflare account. The configured `workerName` must match the Worker connected to the repository. The previous portfolio name, `octavianmironescu-dot-com`, caused this error for this app; the configuration now targets `timezone-converter`.

See Cloudflare's [Workers Builds troubleshooting guide](https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/) for account and Worker-name checks.

### Stale module errors during development

If a newly added export is reported as “not a function,” restart the existing dev server and rerun the localized-route checks. Cloudflare/Vite can retain stale worker modules after export changes. Rebuild before testing production output.

### Build warnings versus failures

UnoCSS duplicate-import and `vite:css-post` warnings can appear while the build still succeeds. Read the final command error when diagnosing deployment. Existing formatting issues in generated or unrelated files can separately cause `vp check` to fail.

## Author and license

Created by **Mironescu Octavian**. [Contact](https://octavianmironescu.com/en/contact).

Application code is licensed under [MIT](LICENSE). Third-party data, libraries, and photographs retain their respective licenses and attribution requirements.
