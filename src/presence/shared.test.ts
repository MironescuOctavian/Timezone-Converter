import { describe, expect, it } from "vite-plus/test";
import { approximateLocation, groupViewers } from "./shared";

const cf = {
  city: "Bucharest",
  country: "RO",
  timezone: "Europe/Bucharest",
  latitude: "44.4268",
  longitude: "26.1025",
};

describe("anonymous globe presence", () => {
  it("shares only coarsened city details, never IPs or precise coordinates", () => {
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
  it("groups viewers in one city without revealing connection identifiers or hidden visitors", () => {
    const location = approximateLocation(cf)!;
    const other = { ...location, city: "Cluj-Napoca" };
    const groups = groupViewers([location, null, location, other]);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual({ ...location, key: "RO:Bucharest:Europe/Bucharest", viewers: 2 });
    expect(groupViewers([null])).toEqual([]);
  });
});
