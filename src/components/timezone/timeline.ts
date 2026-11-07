import { localActivity } from "./activity";
export const TIMELINE_MINUTES = 48 * 60;

export function timelineInstant(start: number, minute: number) {
  return new Date(start + Math.max(0, Math.min(TIMELINE_MINUTES, Math.round(minute))) * 60_000);
}

// Sample actual instants, not invented local hours, so DST repeats/skips and
// fractional timezone offsets stay aligned across every city's shared slider.
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
      period: ({ work: "day", free: "evening", sleep: "night" } as const)[localActivity(hour)],
    };
  });
}
