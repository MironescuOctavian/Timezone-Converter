import { describe, expect, it, vi } from "vite-plus/test";
import { conversionApi } from "./api";
import { Hono } from "hono";

function environment() {
  const fetch = vi.fn().mockResolvedValue(Response.json({ total: 42 }));
  const get = vi.fn().mockReturnValue({ fetch });
  const limit = vi.fn().mockResolvedValue({ success: true });
  const env = {
    CONVERSION_COUNTER: { get, idFromName: vi.fn().mockReturnValue("total") },
    RATE_LIMIT: { limit },
  } as unknown as Env;
  return { env, fetch, get, limit };
}

describe("site conversion counter API", () => {
  it("serves JSON at the mounted client URL", async () => {
    const { env } = environment();
    const app = new Hono<{ Bindings: Env }>().route("/api/conversions", conversionApi);
    const response = await app.request("https://site.test/api/conversions", {}, env);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(await response.json()).toEqual({ total: 42 });
  });
  it("reads the shared total without incrementing it", async () => {
    const { env, fetch, limit } = environment();
    const response = await conversionApi.request("https://site.test/", {}, env);
    expect(await response.json()).toEqual({ total: 42 });
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=15");
    expect(fetch).toHaveBeenCalledWith("https://counter.internal/");
    expect(limit).not.toHaveBeenCalled();
  });

  it("rejects cross-site and missing-origin writes before reaching storage", async () => {
    const { env, get } = environment();
    for (const headers of [{ Origin: "https://other.test" }, {}]) {
      const response = await conversionApi.request(
        "https://site.test/",
        { method: "POST", headers },
        env,
      );
      expect(response.status).toBe(403);
    }
    expect(get).not.toHaveBeenCalled();
  });

  it("rate limits increments and never caches their responses", async () => {
    const { env, fetch, limit } = environment();
    const options = { method: "POST", headers: { Origin: "https://site.test" } };
    const response = await conversionApi.request("https://site.test/", options, env);
    expect(await response.json()).toEqual({ total: 42 });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(fetch).toHaveBeenCalledWith("https://counter.internal/", { method: "POST" });
    limit.mockResolvedValueOnce({ success: false });
    const denied = await conversionApi.request("https://site.test/", options, env);
    expect(denied.status).toBe(429);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("reports storage failure without inventing a total", async () => {
    const { env, fetch } = environment();
    fetch.mockRejectedValueOnce(new Error("Storage unavailable"));
    const response = await conversionApi.request("https://site.test/", {}, env);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Counter unavailable" });
  });
});
