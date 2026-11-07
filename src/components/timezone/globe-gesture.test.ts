import { describe, expect, it } from "vite-plus/test";
import { globeGesture } from "./globe-gesture";

describe("globe touch gestures", () => {
  it("distinguishes a country tap from a one-finger drag", () => {
    const gesture = globeGesture();
    gesture.start(1, 10, 20, 1);
    expect(gesture.end(1)).toBe(true);
    gesture.start(1, 10, 20, 1);
    expect(gesture.move(1, 30, 35)).toEqual({ dx: 20, dy: 15 });
    expect(gesture.end(1)).toBe(false);
  });
  it("pinches in and out within zoom limits without selecting a country", () => {
    const gesture = globeGesture();
    gesture.start(1, 0, 0, 2);
    gesture.start(2, 100, 0, 2);
    expect(gesture.move(2, 150, 0)?.zoom).toBe(3);
    expect(gesture.move(2, 500, 0)?.zoom).toBe(4);
    expect(gesture.move(2, 10, 0)?.zoom).toBe(1);
    expect(gesture.end(2)).toBe(false);
    expect(gesture.active).toBe(true);
    expect(gesture.move(1, 5, 0)).toEqual({ dx: 5, dy: 0 });
    expect(gesture.end(1)).toBe(false);
    expect(gesture.active).toBe(false);
  });
  it("cancels safely and starts a fresh tap after lost capture", () => {
    const gesture = globeGesture();
    gesture.start(1, 0, 0, 1);
    expect(gesture.end(1, true)).toBe(false);
    expect(gesture.end(1)).toBe(false);
    expect(gesture.move(1, 10, 10)).toBeUndefined();
    gesture.start(2, 0, 0, 1);
    expect(gesture.end(2)).toBe(true);
  });
  it("handles overlapping fingers without invalid zoom", () => {
    const gesture = globeGesture();
    gesture.start(1, 0, 0, 1);
    gesture.start(2, 0, 0, 1);
    expect(gesture.move(2, 0, 0)?.zoom).toBe(1);
    expect(gesture.move(2, 20, 0)?.zoom).toBe(1);
    expect(gesture.move(2, 40, 0)?.zoom).toBe(2);
  });
});
