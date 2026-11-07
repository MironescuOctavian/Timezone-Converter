/** @file Tests great-circle distance estimates and kilometre-to-mile conversion. */

import { describe, expect, it } from "vite-plus/test";
import { convertDistance, distanceKm } from "./city-distance";

describe("city distances", () => {
  const london = { latitude: 51.5074, longitude: -0.1278 };
  const newYork = { latitude: 40.7128, longitude: -74.006 };
  it("calculates great-circle distances in kilometres", () => {
    expect(distanceKm(london, london)).toBe(0);
    expect(distanceKm(london, newYork)).toBeCloseTo(5570.23, 1);
    expect(distanceKm(london, newYork)).toBeCloseTo(distanceKm(newYork, london), 8);
  });
  it("converts kilometres to miles without changing the source value", () => {
    expect(convertDistance(1.609344, "mi")).toBeCloseTo(1);
    expect(convertDistance(100, "km")).toBe(100);
  });
});
