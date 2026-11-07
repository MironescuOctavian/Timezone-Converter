/** @file Tests Discord timestamp encoding and localized format previews. */

import { describe, expect, it } from "vite-plus/test";
import { discordPreview, discordTimestamp } from "./discord";

describe("Discord timestamps", () => {
  it("uses Unix seconds and preserves the requested style", () => {
    const instant = new Date("2026-11-07T01:07:30.000Z");
    expect(discordTimestamp(instant, "F")).toBe("<t:1794013650:F>");
    expect(discordTimestamp(instant, "R")).toBe("<t:1794013650:R>");
  });

  it("previews the same instant in the visitor's timezone", () => {
    const instant = new Date("2026-11-07T01:07:30.000Z");
    expect(discordPreview(instant, "T", "Europe/Bucharest", "en-GB")).toBe("3:07:30");
    expect(discordPreview(instant, "t", "America/New_York", "en-GB")).toBe("20:07");
  });
});
