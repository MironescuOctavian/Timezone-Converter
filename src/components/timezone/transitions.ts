/**
 * Detect Daylight Saving Time (DST) transition dates and types for a given IANA timezone and year.
 *
 * Algorithm:
 * 1. Step through the year using weekly samples (7-day intervals) to detect any shift in UTC offset (`timeZoneName: "longOffset"`).
 *    Weekly steps reliably catch rapid transitions (such as spring and autumn changes occurring within short spans).
 * 2. When an offset mismatch between two sample bounds is detected, perform a binary search (bisection) down to 1-minute
 *    precision (`high - low > 60_000`) to locate the exact minute the clock shift takes effect.
 * 3. Compare the old and new offsets:
 *    - An increase in positive offset indicates DST started (clocks sprang forward).
 *    - A decrease indicates DST ended (clocks fell back to standard time).
 * 4. Returns an array of transition events `{ date, started }`. Zones that do not observe DST return an empty array.
 */
export function transitions(zone: string, year: number) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    timeZoneName: "longOffset",
  });
  const offset = (time: number) =>
    formatter.formatToParts(time).find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const result: { date: Date; started: boolean }[] = [];
  let previous = Date.UTC(year, 0, 1);
  let previousOffset = offset(previous);
  const minutes = (name: string) => {
    const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
    return match ? (match[1] === "+" ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3])) : 0;
  };

  const yearEnd = Date.UTC(year + 1, 0, 1);
  // Weekly sampling across the entire calendar year
  while (previous < yearEnd) {
    const next = Math.min(previous + 7 * 86_400_000, yearEnd);
    const nextOffset = offset(next);
    if (nextOffset !== previousOffset) {
      // Binary search to find transition moment down to minute resolution
      let low = previous,
        high = next;
      while (high - low > 60_000) {
        const middle = Math.floor((low + high) / 120_000) * 60_000;
        if (offset(middle) === previousOffset) low = middle;
        else high = middle;
      }
      result.push({ date: new Date(high), started: minutes(nextOffset) > minutes(previousOffset) });
    }
    previous = next;
    previousOffset = nextOffset;
  }
  return result;
}

