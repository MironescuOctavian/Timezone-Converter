/** @file Accepts same-origin presence upgrades and forwards only an explicitly shared broad region. */

import { Hono } from "hono";
import { regionCode } from "./regions";

// Upgrade before response-rebuilding middleware, which would drop the socket.
export const presenceApi = new Hono<{ Bindings: Env }>().get("/", async (c) => {
  const request = c.req.raw;
  if (request.headers.get("Origin") !== new URL(request.url).origin)
    return c.text("Forbidden", 403);
  if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
    return c.text("WebSocket required", 426);
  const params = new URL(request.url).searchParams;
  if (params.get("v") !== "2") return c.text("Reload for regional privacy controls", 426);
  const { success } = await c.env.RATE_LIMIT.limit({
    key: `presence:${request.headers.get("CF-Connecting-IP") ?? "local"}`,
  });
  if (!success) return c.text("Too many connections", 429);
  // Read only a continent, and only after explicit opt-in. Forward no request headers.
  const region =
    params.get("share") === "1"
      ? regionCode((request.cf as Record<string, unknown> | undefined)?.["continent"])
      : null;
  const headers = new Headers({
    Upgrade: "websocket",
    ...(region ? { "X-Viewer-Region": region } : {}),
  });
  const stub = c.env.GLOBE_PRESENCE.get(c.env.GLOBE_PRESENCE.idFromName("world"));
  return stub.fetch(new Request("https://presence.internal/", { headers }));
});
