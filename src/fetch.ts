import { Hono } from "hono";
import { security } from "@rimelight/security/middleware";
import { i18n } from "@rimelight/i18n/middleware";
import { seo } from "@rimelight/seo/middleware";
import { handleRequest } from "virtual:solid-ssr-handler";
import { approximateLocation } from "./presence/shared";
export { GlobePresence } from "./presence/GlobePresence";

const app = new Hono<{ Bindings: Env }>();

// Handle upgrades before middleware that rebuilds Response objects and drops webSocket.
// This endpoint enforces its own same-origin check and connection rate limit.
app.get("/api/presence", async (c) => {
  const request = c.req.raw;
  if (request.headers.get("Origin") !== new URL(request.url).origin)
    return c.text("Forbidden", 403);
  if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
    return c.text("WebSocket required", 426);
  const { success } = await c.env.RATE_LIMIT.limit({
    key: `presence:${request.headers.get("CF-Connecting-IP") ?? "local"}`,
  });
  if (!success) return c.text("Too many connections", 429);
  const location =
    new URL(request.url).searchParams.get("share") === "0"
      ? null
      : approximateLocation(request.cf as Record<string, unknown> | undefined);
  const headers = new Headers({
    Upgrade: "websocket",
    "X-Viewer-Location": JSON.stringify(location),
  });
  const stub = c.env.GLOBE_PRESENCE.get(c.env.GLOBE_PRESENCE.idFromName("world"));
  return stub.fetch(new Request("https://presence.internal/", { headers }));
});
app.use(security());
// Private, coarsened location for distance estimates, even when a viewer hides their public dot.
app.get("/api/location", (c) => {
  c.header("Cache-Control", "private, no-store");
  const origin = c.req.header("Origin");
  if (origin && origin !== new URL(c.req.url).origin) return c.json(null, 403);
  return c.json(approximateLocation(c.req.raw.cf as Record<string, unknown> | undefined));
});
app.use(i18n());
app.use(seo());

app.all("*", (c) => handleRequest(c.req.raw));

export default app;
