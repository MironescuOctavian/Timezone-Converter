import { Hono } from "hono";
import { publicHolidays } from "../components/timezone/holidays";

/**
 * Public Holidays API Router.
 *
 * Proxies and normalizes public holiday calendars via Nager.Date API, caching responses
 * at Cloudflare's edge (`cf.cacheEverything`).
 *
 * Privacy & Security:
 * - Only the ISO 2-letter country code and 4-digit year are sent upstream.
 * - The browser makes no third-party network requests, keeping client IP private from external services.
 * - Strict regex input validation guards against SSRF and malformed parameters.
 */
export const holidayApi = new Hono().get("/:country/:year", async (c) => {
  const country = c.req.param("country").toUpperCase();
  const year = c.req.param("year");

  // Validate country code (ISO 3166-1 alpha-2) and reasonable 4-digit year range
  if (
    !/^[A-Z]{2}$/.test(country) ||
    !/^\d{4}$/.test(year) ||
    Number(year) < 1900 ||
    Number(year) > 2100
  )
    return c.json({ error: "Invalid country or year" }, 400);

  c.header("Cache-Control", "no-store");
  try {
    // Fetch from Nager.Date with 8-second timeout and Cloudflare edge caching
    const response = await fetch(`https://nagerholidays.com/api/v4/Holidays/${country}/${year}`, {
      signal: AbortSignal.timeout(8000),
      cf: {
        cacheEverything: true,
        cacheTtlByStatus: { "200-299": 86400, "404": 3600, "500-599": 0 },
      },
    });

    // Handle countries without public calendar data
    if (response.status === 404 || response.status === 204 || response.status === 400) {
      c.header("Cache-Control", "public, max-age=300");
      return c.json({ supported: false, holidays: [] });
    }
    if (!response.ok) throw new Error("Holiday service unavailable");

    // Filter and sanitize holidays to official public holidays
    const holidays = publicHolidays(await response.json(), country);

    // Cache successful responses for 1 hour with stale-while-revalidate for 24 hours
    c.header("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return c.json({ supported: true, holidays });
  } catch {
    return c.json({ error: "Holiday service unavailable" }, 503);
  }
});

