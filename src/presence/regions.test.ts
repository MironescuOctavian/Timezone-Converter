import { describe, expect, it } from "vite-plus/test";
import {
  isPresenceAttachment,
  regionCode,
  regionSnapshot,
  withdrawSnapshot,
  REGIONS,
  type PresenceAttachment,
} from "./regions";

const connections = (
  count: number,
  region: PresenceAttachment["region"] = "EU",
): PresenceAttachment[] => Array.from({ length: count }, () => ({ version: 2, region }));

describe("regional presence privacy", () => {
  it("accepts only known broad regions and rejects legacy city attachments", () => {
    expect(regionCode("EU")).toBe("EU");
    for (const value of ["Bucharest", "Europe/Bucharest", "toString", undefined, {}])
      expect(regionCode(value)).toBeNull();
    expect(isPresenceAttachment({ version: 2, region: null })).toBe(true);
    expect(isPresenceAttachment({ city: "Bucharest", country: "RO", latitude: 44.5 })).toBe(false);
    expect(isPresenceAttachment({ version: 2, region: "EU", city: "Bucharest" })).toBe(false);
  });
  it("suppresses groups below five and rounds counts into bands", () => {
    expect(regionSnapshot(connections(4)).regions).toEqual([]);
    for (const count of [5, 6, 9]) {
      const result = regionSnapshot(connections(count));
      expect(result.total).toBe(5);
      expect(result.regions).toEqual([
        { key: "EU", latitude: REGIONS.EU.latitude, longitude: REGIONS.EU.longitude, viewers: 5 },
      ]);
      expect(Object.keys(result.regions[0]!)).toEqual(["key", "latitude", "longitude", "viewers"]);
    }
    expect(regionSnapshot(connections(10)).regions[0]?.viewers).toBe(10);
  });
  it("counts hidden connections only in the coarse global total", () => {
    const result = regionSnapshot([...connections(4), ...connections(7, null)]);
    expect(result.total).toBe(10);
    expect(result.regions).toEqual([]);
  });
  it("withdraws immediately without revealing pending arrivals or new regions", () => {
    const published = regionSnapshot(connections(5));
    const current = regionSnapshot([...connections(4), ...connections(6, "AS")]);
    const withdrawn = withdrawSnapshot(published, current);
    expect(withdrawn.regions).toEqual([]);
    expect(withdrawn.total).toBe(5);
    const lower = withdrawSnapshot(regionSnapshot(connections(10)), regionSnapshot(connections(9)));
    expect(lower.regions[0]?.viewers).toBe(5);
  });
});
