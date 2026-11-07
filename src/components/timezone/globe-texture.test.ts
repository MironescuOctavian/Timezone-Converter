import { describe, expect, it } from "vite-plus/test";
import { geoOrthographic, geoRotation } from "d3-geo";
import { globeViewport, inverseGlobeRotation } from "./globe-texture";

describe("textured sphere coordinates", () => {
  it("maps visible framebuffer pixels to the same geographic coordinates at every zoom", () => {
    for (const zoom of [1, 1.25, 2, 3, 4]) {
      const view = globeViewport(zoom);
      expect(view.x + view.width / 2).toBe(260);
      for (const clipX of [-1, -0.5, 0, 0.5, 1]) {
        const svgX = view.x + ((clipX + 1) / 2) * view.width;
        expect((svgX - 260) / 245).toBeCloseTo(clipX * (260 / 245) * view.scaleX, 10);
      }
    }
    expect(globeViewport(0)).toEqual(globeViewport(1));
    expect(globeViewport(10)).toEqual(globeViewport(4));
  });
  it("covers tall and wide SVG panels without clipping country strips", () => {
    for (const [width, height] of [
      [666, 1000],
      [1000, 666],
      [390, 280],
    ]) {
      for (const zoom of [1, 1.75, 4]) {
        const view = globeViewport(zoom, width! / height!);
        const pixelsPerUnit = Math.min(width!, height!) / (520 / zoom);
        expect(view.width * pixelsPerUnit).toBeCloseTo(width!, 8);
        expect(view.height * pixelsPerUnit).toBeCloseTo(height!, 8);
        expect(view.x + view.width / 2).toBeCloseTo(260, 8);
        expect(view.y + view.height / 2).toBeCloseTo(260, 8);
        const svgTop = 260 - height! / (2 * pixelsPerUnit);
        expect((svgTop - 260) / 245).toBeCloseTo(-(260 / 245) * view.scaleY, 8);
      }
    }
    expect(globeViewport(2, 0)).toEqual(globeViewport(2));
  });
  it("aligns the texture with SVG labels and picking across rotations", () => {
    for (const rotation of [
      [0, 0, 0],
      [-25, -15, 0],
      [90, 45, 0],
      [180, -90, 0],
      [-160, 60, 20],
    ] as [number, number, number][]) {
      const matrix = inverseGlobeRotation(rotation);
      const projection = geoOrthographic().translate([260, 260]).scale(245).rotate(rotation);
      for (const point of [
        [0, 0],
        [20, 30],
        [-40, -10],
      ] as [number, number][]) {
        const world = geoRotation(rotation).invert(point);
        const p = projection(world)!;
        const x = (p[0] - 260) / 245,
          y = (260 - p[1]) / 245;
        const camera = [Math.sqrt(1 - x * x - y * y), x, y];
        const result = [0, 1, 2].map((row) =>
          camera.reduce((sum, value, column) => sum + matrix[column * 3 + row]! * value, 0),
        );
        const longitude = (Math.atan2(result[1]!, result[0]!) * 180) / Math.PI;
        const latitude = (Math.asin(Math.max(-1, Math.min(1, result[2]!))) * 180) / Math.PI;
        expect(Math.sin((longitude * Math.PI) / 180)).toBeCloseTo(
          Math.sin((world[0] * Math.PI) / 180),
          5,
        );
        expect(Math.cos((longitude * Math.PI) / 180)).toBeCloseTo(
          Math.cos((world[0] * Math.PI) / 180),
          5,
        );
        expect(latitude).toBeCloseTo(world[1], 4);
      }
    }
  });
});
