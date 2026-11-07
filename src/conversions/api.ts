import { Hono } from "hono";

/**
 * Conversions API Router.
 *
 * Handles public reads and rate-limited increments of the global conversion counter.
 *
 * Security:
 * - Origin header verification prevents cross-origin unauthorized increments.
 * - Cloudflare RATE_LIMIT binding throttles increments per client IP.
 */
export const conversionApi = new Hono<{ Bindings: Env }>()
  // GET /api/conversions: Fetch the current total conversion count (cached publicly for 15s)
  .get("/", async (c) => {
    c.header("Cache-Control", "no-store");
    try {
      const counter = c.env.CONVERSION_COUNTER.get(c.env.CONVERSION_COUNTER.idFromName("total"));
      const response = await counter.fetch("https://counter.internal/");
      c.header("Cache-Control", "public, max-age=15");
      return c.json(await response.json());
    } catch {
      return c.json({ error: "Counter unavailable" }, 503);
    }
  })
  // POST /api/conversions: Increment conversion count upon user conversion interaction
  .post("/", async (c) => {
    c.header("Cache-Control", "no-store");
    // Verify request originates from the same site
    if (c.req.header("Origin") !== new URL(c.req.url).origin) return c.text("Forbidden", 403);

    // Apply per-IP rate limiting via Cloudflare Rate Limiting binding
    const { success } = await c.env.RATE_LIMIT.limit({
      key: `conversion:${c.req.header("CF-Connecting-IP") ?? "local"}`,
    });
    if (!success) return c.text("Too many requests", 429);

    try {
      const counter = c.env.CONVERSION_COUNTER.get(c.env.CONVERSION_COUNTER.idFromName("total"));
      const response = await counter.fetch("https://counter.internal/", { method: "POST" });
      return c.json(await response.json());
    } catch {
      return c.json({ error: "Counter unavailable" }, 503);
    }
  });

