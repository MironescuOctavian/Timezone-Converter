/** @file Tests geometry simplification without losing small rings or mutating source coordinates. */

import { describe, expect, it } from "vite-plus/test";
import { coarseRing } from "./CanvasCountries";

describe("drag-only country detail", () => {
  it("preserves small rings and leaves original geometry unchanged", () => {
    const small = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
    ];
    expect(coarseRing(small)).toBe(small);
    const ring = Array.from({ length: 30 }, (_, index) => [Math.cos(index), Math.sin(index)]);
    ring.push([...ring[0]!]);
    const original = structuredClone(ring);
    const coarse = coarseRing(ring);
    expect(coarse.length).toBeLessThan(ring.length);
    expect(coarse.length).toBeGreaterThanOrEqual(4);
    expect(coarse[0]).toEqual(coarse.at(-1));
    expect(ring).toEqual(original);
  });
});
