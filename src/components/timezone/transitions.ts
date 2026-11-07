// Sample the timezone database, then narrow each offset change to the minute.
// A forward change starts DST; a backward change ends it. Zones with no change
// have no DST row, and dates are calculated anew for the current year.
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
  // Weekly samples also catch two changes occurring within the same month.
  const yearEnd = Date.UTC(year + 1, 0, 1);
  while (previous < yearEnd) {
    const next = Math.min(previous + 7 * 86_400_000, yearEnd);
    const nextOffset = offset(next);
    if (nextOffset !== previousOffset) {
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
