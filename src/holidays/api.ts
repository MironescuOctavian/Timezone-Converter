import { Hono } from "hono";
import { publicHolidays } from "../components/timezone/holidays";

// Cache public calendars at Cloudflare's edge. Only a country code and year go
// upstream; the browser needs no new third-party connection or API credentials.
export const holidayApi = new Hono().get("/:country/:year", async (c) => {
  const country = c.req.param("country").toUpperCase();
  const year = c.req.param("year");
  if (
    !/^[A-Z]{2}$/.test(country) ||
    !/^\d{4}$/.test(year) ||
    Number(year) < 1900 ||
    Number(year) > 2100
  )
    return c.json({ error: "Invalid country or year" }, 400);
  c.header("Cache-Control", "no-store");
  try {
    const response = await fetch(`https://nagerholidays.com/api/v4/Holidays/${country}/${year}`, {
      signal: AbortSignal.timeout(8000),
      cf: {
        cacheEverything: true,
        cacheTtlByStatus: { "200-299": 86400, "404": 3600, "500-599": 0 },
      },
    });
    if (response.status === 404 || response.status === 204 || response.status === 400) {
      c.header("Cache-Control", "public, max-age=300");
      return c.json({ supported: false, holidays: [] });
    }
    if (!response.ok) throw new Error("Holiday service unavailable");
    const holidays = publicHolidays(await response.json(), country);
    c.header("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return c.json({ supported: true, holidays });
  } catch {
    return c.json({ error: "Holiday service unavailable" }, 503);
  }
});
