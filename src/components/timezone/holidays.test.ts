import { describe, expect, it } from "vite-plus/test";
import { holidayDateKey, publicHolidays, selectHolidays } from "./holidays";

const nationwide = {
  date: "2026-12-25",
  name: "Christmas Day",
  countryCode: "DE",
  nationalHoliday: true,
  subdivisionCodes: null,
  holidayTypes: ["Public"],
};
const regional = {
  ...nationwide,
  date: "2026-11-01",
  name: "All Saints' Day",
  nationalHoliday: false,
  subdivisionCodes: ["DE-BY"],
};

describe("public-holiday calendars", () => {
  it("distinguishes nationwide holidays from regional dates and excludes observances", () => {
    const holidays = publicHolidays(
      [
        nationwide,
        regional,
        { ...nationwide, name: "Observance", holidayTypes: ["Observance"] },
        { ...nationwide, name: "Bank only", holidayTypes: ["Bank"] },
      ],
      "DE",
    );
    expect(holidays).toHaveLength(2);
    expect(holidays[0]).toMatchObject({
      name: "All Saints' Day",
      nationalHoliday: false,
      subdivisionCodes: ["DE-BY"],
    });
    expect(holidays[1]?.nationalHoliday).toBe(true);
  });
  it("does not turn invalid dates or another country's data into days off", () => {
    expect(
      publicHolidays(
        [{ ...nationwide, date: "2026-02-30" }, { ...nationwide, countryCode: "FR" }, null],
        "DE",
      ),
    ).toEqual([]);
    expect(() => publicHolidays({}, "DE")).toThrow();
  });
  it("filters upcoming national dates by default and includes regional/past dates explicitly", () => {
    const holidays = publicHolidays([nationwide, regional], "DE");
    expect(selectHolidays(holidays, "2026-10-01", false, false)).toHaveLength(1);
    expect(selectHolidays(holidays, "2026-10-01", true, false)).toHaveLength(2);
    expect(selectHolidays(holidays, "2026-12-01", true, false)).toHaveLength(1);
    expect(selectHolidays(holidays, "2026-12-01", true, true)).toHaveLength(2);
  });
  it("uses the selected city's calendar date and year rather than the viewer's UTC date", () => {
    const moment = new Date("2026-12-31T23:30:00Z");
    expect(holidayDateKey(moment, "Asia/Tokyo")).toBe("2027-01-01");
    expect(holidayDateKey(moment, "America/New_York")).toBe("2026-12-31");
  });
});
