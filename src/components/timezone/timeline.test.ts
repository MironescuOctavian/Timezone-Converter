/** @file Tests shared timeline instants, range limits, and timezone activity bands. */

import { describe, expect, it } from "vite-plus/test";
import { TIMELINE_MINUTES, timelineBands, timelineInstant } from "./timeline";

describe("synchronized city timelines", () => {
  it("selects one absolute instant for every city and clamps the 48-hour range", () => {
    const start = Date.parse("2026-11-05T00:00:00Z");
    expect(timelineInstant(start, 19 * 60).toISOString()).toBe("2026-11-05T19:00:00.000Z");
    expect(timelineInstant(start, -1).getTime()).toBe(start);
    expect(timelineInstant(start, TIMELINE_MINUTES + 1).toISOString()).toBe(
      "2026-11-07T00:00:00.000Z",
    );
  });
  it("preserves repeated and skipped local hours across DST changes", () => {
    expect(
      timelineBands(Date.parse("2026-11-01T04:00:00Z"), "America/New_York")
        .slice(0, 4)
        .map((band) => band.hour),
    ).toEqual([0, 1, 1, 2]);
    expect(
      timelineBands(Date.parse("2026-03-08T05:00:00Z"), "America/New_York")
        .slice(0, 4)
        .map((band) => band.hour),
    ).toEqual([0, 1, 3, 4]);
  });
  it("classifies typical local hours, including fractional-offset zones", () => {
    const bands = timelineBands(Date.parse("2026-11-05T00:00:00Z"), "Asia/Kolkata");
    expect(bands).toHaveLength(48);
    expect(bands[0]).toMatchObject({ hour: 5, period: "night" });
    expect(bands[2]).toMatchObject({ hour: 7, period: "evening" });
    expect(bands[4]).toMatchObject({ hour: 9, period: "day" });
  });
});
