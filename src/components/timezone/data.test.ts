import { describe, expect, it } from "vite-plus/test";
import { geoContains, geoOrthographic, geoPath } from "d3-geo";
import { countries, globeGrid } from "./data";
import {
  clockParts,
  differenceLabel,
  differenceMinutes,
  formatClipboardTime,
  toInstant,
} from "./data";

describe("timezone calculations", () => {
  it("includes Antarctica and renders both poles without inventing Arctic land", () => {
    const antarctica = countries.find((country) => country.properties.name === "Antarctica");
    expect(antarctica).toBeDefined();
    expect(geoContains(antarctica!, [0, -89.9])).toBe(true);
    expect(countries.some((country) => geoContains(country, [0, 89.9]))).toBe(false);
    for (const latitude of [-90, 90]) {
      const projection = geoOrthographic().translate([260, 260]).scale(245).rotate([0, -latitude]);
      expect(projection([0, latitude])![0]).toBeCloseTo(260);
      expect(projection([0, latitude])![1]).toBeCloseTo(260);
      const grid = geoPath(projection)(globeGrid);
      expect(grid).toBeTruthy();
      expect(grid).not.toContain("NaN");
    }
  });
  it("preserves seconds and handles date boundaries", () => {
    expect(toInstant("2026-11-07T00:15:45", "Europe/Bucharest")?.toISOString()).toBe(
      "2026-11-06T22:15:45.000Z",
    );
    expect(toInstant("2026-01-01T00:00", "Asia/Kolkata")?.toISOString()).toBe(
      "2025-12-31T18:30:00.000Z",
    );
  });
  it("rejects local times skipped by daylight saving", () => {
    expect(toInstant("2026-03-29T03:30:45", "Europe/Bucharest")).toBeUndefined();
  });
  it("compares fractional offsets and displays seconds", () => {
    const date = new Date("2026-11-07T00:00:45Z");
    expect(differenceLabel(differenceMinutes(date, "Asia/Kolkata", "Europe/Bucharest"))).toBe(
      "3h 30m ahead of you",
    );
    expect(clockParts(date, "UTC").find((part) => part.type === "second")?.value).toBe("45");
  });
  it("formats copied dates and seconds in each timezone, including across midnight", () => {
    const date = new Date("2026-11-06T22:00:45Z");
    expect(formatClipboardTime(date, "Europe/Bucharest")).toBe("07/11/26 → 00/00/45");
    expect(formatClipboardTime(date, "America/New_York")).toBe("06/11/26 → 17/00/45");
  });
});
