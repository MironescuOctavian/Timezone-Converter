/** @file Classifies local hours into illustrative work, free-time, and sleep bands. */

// These are illustrative local-hour bands, not a person's actual schedule.
export function localActivity(hour: number): "work" | "free" | "sleep" {
  return hour >= 9 && hour < 17 ? "work" : hour >= 7 && hour < 22 ? "free" : "sleep";
}
