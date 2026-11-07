import { Hono } from "hono";

export const conversionApi = new Hono<{ Bindings: Env }>()
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
  .post("/", async (c) => {
    c.header("Cache-Control", "no-store");
    if (c.req.header("Origin") !== new URL(c.req.url).origin) return c.text("Forbidden", 403);
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
