/** @file Tests presence consent boundaries, metadata minimization, protocol checks, and request limits. */

import { describe, expect, it, vi } from "vite-plus/test";
import { presenceApi } from "./api";
import { REGION_SHARING_KEY, regionSharingEnabled } from "./consent";

function fixture() {
  const fetch = vi.fn().mockResolvedValue(new Response("upgraded"));
  const limit = vi.fn().mockResolvedValue({ success: true });
  return {
    fetch,
    limit,
    env: {
      RATE_LIMIT: { limit },
      GLOBE_PRESENCE: {
        idFromName: vi.fn().mockReturnValue("world"),
        get: vi.fn().mockReturnValue({ fetch }),
      },
    } as unknown as Env,
  };
}
function request(query: string) {
  return new Request(`https://site.test/${query}`, {
    headers: { Origin: "https://site.test", Upgrade: "websocket", "CF-Connecting-IP": "192.0.2.1" },
  });
}
describe("presence consent boundary", () => {
  it("does not read location metadata without explicit opt-in", async () => {
    const { fetch, env } = fixture();
    for (const query of ["?v=2", "?v=2&share=0", "?v=2&share=true"]) {
      const req = request(query);
      Object.defineProperty(req, "cf", {
        get: () => {
          throw Error("Metadata must not be read");
        },
      });
      expect((await presenceApi.fetch(req, env)).status).toBe(200);
      const forwarded = fetch.mock.calls.at(-1)![0] as Request;
      expect([...forwarded.headers]).toEqual([["upgrade", "websocket"]]);
    }
  });
  it("forwards only a known continent after opt-in, never city, timezone or IP", async () => {
    const { fetch, env } = fixture();
    const req = Object.assign(request("?v=2&share=1&region=AS"), {
      cf: {
        continent: "EU",
        city: "Bucharest",
        timezone: "Europe/Bucharest",
        latitude: 44.4268,
        longitude: 26.1025,
      },
    });
    await presenceApi.fetch(req, env);
    const forwarded = fetch.mock.calls[0]![0] as Request;
    expect([...forwarded.headers]).toEqual([
      ["upgrade", "websocket"],
      ["x-viewer-region", "EU"],
    ]);
    expect(forwarded.url).toBe("https://presence.internal/");
  });
  it("rejects old protocol, foreign origins and rate-limited requests", async () => {
    const { fetch, env, limit } = fixture();
    expect((await presenceApi.fetch(request("?share=1"), env)).status).toBe(426);
    const foreign = request("?v=2");
    foreign.headers.set("Origin", "https://other.test");
    expect((await presenceApi.fetch(foreign, env)).status).toBe(403);
    limit.mockResolvedValueOnce({ success: false });
    expect((await presenceApi.fetch(request("?v=2"), env)).status).toBe(429);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("never treats old preferences, missing storage or errors as consent", () => {
    expect(
      regionSharingEnabled({ getItem: (key) => (key === "hide-globe-presence" ? "false" : null) }),
    ).toBe(false);
    expect(
      regionSharingEnabled({
        getItem: () => {
          throw Error("Storage unavailable");
        },
      }),
    ).toBe(false);
    expect(
      regionSharingEnabled({ getItem: (key) => (key === REGION_SHARING_KEY ? "true" : null) }),
    ).toBe(true);
  });
});
