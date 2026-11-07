import { Hono } from "hono";
import { security } from "@rimelight/security/middleware";
import { i18n } from "@rimelight/i18n/middleware";
import { seo } from "@rimelight/seo/middleware";
import { handleRequest } from "virtual:solid-ssr-handler";
import { approximateLocation } from "./presence/shared";
import { presenceApi } from "./presence/api";
import { holidayApi } from "./holidays/api";
import { conversionApi } from "./conversions/api";
export { ConversionCounter } from "./conversions/ConversionCounter";
export { GlobePresence } from "./presence/GlobePresence";

const app = new Hono<{ Bindings: Env }>();

// WebSocket upgrades bypass response-rebuilding middleware.
app.route("/api/presence", presenceApi);
app.use(security());
// Private, coarsened location for distance estimates, even when a viewer hides their public dot.
app.get("/api/location", (c) => {
  c.header("Cache-Control", "private, no-store");
  const origin = c.req.header("Origin");
  if (origin && origin !== new URL(c.req.url).origin) return c.json(null, 403);
  return c.json(approximateLocation(c.req.raw.cf as Record<string, unknown> | undefined));
});
app.route("/api/holidays", holidayApi);
app.route("/api/conversions", conversionApi);
app.use(i18n());
app.use(seo());

app.all("*", (c) => handleRequest(c.req.raw));

export default app;
