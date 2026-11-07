import { describe, expect, it } from "vite-plus/test";
import { geoOrthographic } from "d3-geo";
import { geographicLabels } from "./geographic-labels";

const projection = () => geoOrthographic().translate([260, 260]).scale(245);

describe("globe geographic labels", () => {
  it("shows continents initially and keeps ocean labels when zooming", () => {
    const project = projection().rotate([35, -12]);
    expect(geographicLabels(project, 1).some((label) => !label.ocean)).toBe(true);
    const zoomed = geographicLabels(project, 2);
    expect(zoomed.every((label) => label.ocean)).toBe(true);
    expect(zoomed.some((label) => label.name === "Atlantic Ocean")).toBe(true);
  });
  it("labels the Pacific once when rotating across the date line", () => {
    for (const longitude of [-165, 145, 180]) {
      const labels = geographicLabels(projection().rotate([longitude, 0]), 1);
      expect(labels.filter((label) => label.name === "Pacific Ocean")).toHaveLength(1);
      expect(new Set(labels.map((label) => label.name)).size).toBe(labels.length);
      expect(labels.some((label) => label.name === "Europe")).toBe(false);
    }
  });
});
