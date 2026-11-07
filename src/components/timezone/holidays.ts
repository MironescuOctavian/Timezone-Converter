export type PublicHoliday = {
  date: string;
  name: string;
  nationalHoliday: boolean;
  subdivisionCodes: string[];
};

// Discard observances, school-only and bank-only dates: they do not establish
// a general public holiday. Keep regional scope explicit rather than guessing it.
export function publicHolidays(value: unknown, country: string): PublicHoliday[] {
  if (!Array.isArray(value)) throw new Error("Invalid holiday response");
  return value
    .flatMap((item: unknown) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      const date = row["date"],
        name = row["name"];
      if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        typeof name !== "string" ||
        !name.trim() ||
        row["countryCode"] !== country ||
        !Array.isArray(row["holidayTypes"]) ||
        !row["holidayTypes"].includes("Public")
      )
        return [];
      const stamp = Date.parse(`${date}T00:00:00Z`);
      if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== date) return [];
      return [
        {
          date,
          name: name.trim().slice(0, 180),
          nationalHoliday: row["nationalHoliday"] === true,
          subdivisionCodes: Array.isArray(row["subdivisionCodes"])
            ? row["subdivisionCodes"].filter(
                (code): code is string =>
                  typeof code === "string" && code.startsWith(`${country}-`),
              )
            : [],
        },
      ];
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

export function holidayDateKey(date: Date, zone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function selectHolidays(
  holidays: PublicHoliday[],
  day: string,
  regional: boolean,
  fullYear: boolean,
) {
  return holidays.filter(
    (holiday) => (regional || holiday.nationalHoliday) && (fullYear || holiday.date >= day),
  );
}
