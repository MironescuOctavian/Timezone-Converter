/** @file Tests formatter reuse and the bounded date-format cache. */

import { describe, expect, it } from "vite-plus/test";
import { dateFormatter } from "./date-format";

describe("shared date formatters", () => {
  it("reuses equivalent options regardless of property order", () => {
    expect(dateFormatter("en-GB", { timeZone: "UTC", hour: "2-digit" })).toBe(
      dateFormatter("en-GB", { hour: "2-digit", timeZone: "UTC" }),
    );
  });

  it("keeps locales and timezones isolated across requests", () => {
    const instant = new Date("2026-12-31T23:30:00Z");
    const options = { year: "numeric", month: "2-digit", day: "2-digit" } as const;
    expect(dateFormatter("en-GB", { ...options, timeZone: "Asia/Tokyo" }).format(instant)).toBe(
      "01/01/2027",
    );
    expect(
      dateFormatter("en-US", { ...options, timeZone: "America/New_York" }).format(instant),
    ).toBe("12/31/2026");
  });
});
