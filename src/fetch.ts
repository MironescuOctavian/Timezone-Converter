import { Hono } from "hono";
import { security } from "@rimelight/security/middleware";
import { i18n } from "@rimelight/i18n/middleware";
import { seo } from "@rimelight/seo/middleware";
import { handleRequest } from "virtual:solid-ssr-handler";
import { approximateLocation } from "./presence/shared";
import { presenceApi } from "./presence/api";
import { holidayApi } from "./holidays/api";
import { conversionApi } from "./conversions/api";

// Re-export Durable Object classes for Cloudflare Workers runtime binding
export { ConversionCounter } from "./conversions/ConversionCounter";
export { GlobePresence } from "./presence/GlobePresence";

/**
 * Main Edge Application Router (Hono on Cloudflare Workers).
 *
 * Middleware execution pipeline:
 * 1. `/api/presence`: WebSocket upgrades routed first to avoid stream-buffering or body-modifying middleware.
 * 2. `security()`: Sets HTTP security headers (CSP, HSTS, X-Content-Type-Options, etc.).
 * 3. `/api/location`: Returns coarsened visitor coordinates derived from Cloudflare headers (`cf`) for distance estimation.
 * 4. `/api/holidays`: Proxies & caches international public holidays via Nager.Date.
 * 5. `/api/conversions`: Atomically tracks global conversion counts via Durable Object.
 * 6. `i18n()` & `seo()`: Locale negotiation, canonical URLs, and dynamic metadata injection.
 * 7. Fallback `*`: Delegates to Solid SSR renderer (`handleRequest`).
 */
const app = new Hono<{ Bindings: Env }>();

// 1. WebSocket upgrades bypass response-rebuilding and security middleware.
app.route("/api/presence", presenceApi);

// 2. Global security middleware (headers, framing protection).
app.use(security());

// 3. Private, coarsened location endpoint for distance estimates.
// Protected by same-origin check; returns approximate latitude/longitude without storing PII.
app.get("/api/location", (c) => {
  c.header("Cache-Control", "private, no-store");
  const origin = c.req.header("Origin");
  if (origin && origin !== new URL(c.req.url).origin) return c.json(null, 403);
  return c.json(approximateLocation(c.req.raw.cf as Record<string, unknown> | undefined));
});

// 4. API sub-routers
app.route("/api/holidays", holidayApi);
app.route("/api/conversions", conversionApi);

// 5. Localization and SEO middlewares for SSR routes
app.use(i18n());
app.use(seo());

// 6. Solid.js server-side rendering handler for all page routes
app.all("*", (c) => handleRequest(c.req.raw));

export default app;

