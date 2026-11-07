import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { holidayApi } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("holiday API integration", () => {
  it("rejects invalid input before contacting the provider", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const response = await holidayApi.request("/RO/9999");
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("normalizes public holidays and publishes cache headers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json([
          {
            date: "2026-12-01",
            name: "National Day",
            countryCode: "RO",
            nationalHoliday: true,
            holidayTypes: ["Public"],
          },
          {
            date: "2026-12-02",
            name: "Observance",
            countryCode: "RO",
            nationalHoliday: true,
            holidayTypes: ["Observance"],
          },
        ]),
      ),
    );
    const response = await holidayApi.request("/ro/2026");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("max-age=3600");
    expect(await response.json()).toEqual({
      supported: true,
      holidays: [
        { date: "2026-12-01", name: "National Day", nationalHoliday: true, subdivisionCodes: [] },
      ],
    });
  });

  it("distinguishes missing coverage from temporary failure", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockRejectedValueOnce(new Error("Network unavailable"));
    vi.stubGlobal("fetch", fetch);
    const unsupported = await holidayApi.request("/ZZ/2026");
    expect(await unsupported.json()).toEqual({ supported: false, holidays: [] });
    const failure = await holidayApi.request("/RO/2026");
    expect(failure.status).toBe(503);
    expect(failure.headers.get("Cache-Control")).toBe("no-store");
  });
});
