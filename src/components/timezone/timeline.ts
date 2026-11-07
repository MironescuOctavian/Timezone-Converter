/** @file Maps the shared 48-hour slider range to instants and local activity color bands. */

import { localActivity } from "./activity";

/** Total span of the visual timeline in minutes (48 hours = 2 days) */
export const TIMELINE_MINUTES = 48 * 60;

/**
 * Convert a slider minute offset (0 to 2880) into an exact Date instant
 * anchored from the timeline start timestamp.
 */
export function timelineInstant(start: number, minute: number) {
  return new Date(start + Math.max(0, Math.min(TIMELINE_MINUTES, Math.round(minute))) * 60_000);
}

/**
 * Compute 48 hourly blocks for a given timezone across the timeline window.
 *
 * Samples actual physical instants (epoch timestamps in 1-hour increments) rather than
 * generating synthetic hour numbers. This ensures Daylight Saving transitions (repeated/skipped hours)
 * and fractional timezone offsets (e.g., India UTC+5:30, Nepal UTC+5:45) remain strictly synchronized
 * across all cities on the shared timeline slider.
 */
export function timelineBands(start: number, zone: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    hourCycle: "h23",
  });
  return Array.from({ length: 48 }, (_, index) => {
    const stamp = start + index * 3_600_000;
    const hour = Number(formatter.format(stamp));
    return {
      stamp,
      hour,
      // Map activity classification (work, free, sleep) to color periods (day, evening, night)
      period: ({ work: "day", free: "evening", sleep: "night" } as const)[localActivity(hour)],
    };
  });
}
