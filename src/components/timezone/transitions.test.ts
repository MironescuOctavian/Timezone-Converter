/** @file Tests daylight-saving transition detection and zones without seasonal offset changes. */

import { describe, expect, it } from "vite-plus/test";
import { transitions } from "./transitions";

describe("daylight-saving transitions", () => {
  it("finds the actual 2026 changes in Bucharest", () => {
    const changes = transitions("Europe/Bucharest", 2026);
    expect(changes.map((change) => [change.date.toISOString(), change.started])).toEqual([
      ["2026-03-29T01:00:00.000Z", true],
      ["2026-10-25T01:00:00.000Z", false],
    ]);
  });

  it("omits daylight-saving changes for Japan and handles southern seasons", () => {
    expect(transitions("Asia/Tokyo", 2026)).toEqual([]);
    expect(transitions("Australia/Sydney", 2026).map((change) => change.started)).toEqual([
      false,
      true,
    ]);
  });
});
