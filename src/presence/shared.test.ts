import { describe, expect, it } from "vite-plus/test";
import { approximateLocation } from "./shared";

const cf = {
  city: "Bucharest",
  country: "RO",
  timezone: "Europe/Bucharest",
  latitude: "44.4268",
  longitude: "26.1025",
};

describe("private distance location", () => {
  it("returns coarsened details only for the private distance endpoint", () => {
    const location = approximateLocation({ ...cf, ip: "192.0.2.1" } as typeof cf);
    expect(location).toEqual({
      city: "Bucharest",
      country: "RO",
      timezone: "Europe/Bucharest",
      latitude: 44.5,
      longitude: 26,
    });
    expect(JSON.stringify(location)).not.toContain("192.0.2.1");
  });
  it("does not invent a location when Cloudflare metadata is missing or invalid", () => {
    expect(approximateLocation()).toBeNull();
    expect(approximateLocation({ ...cf, latitude: null })).toBeNull();
    expect(approximateLocation({ ...cf, longitude: "not a coordinate" })).toBeNull();
    expect(approximateLocation({ ...cf, latitude: 100 })).toBeNull();
    expect(approximateLocation({ ...cf, timezone: "not/a/zone" })).toBeNull();
  });
});
