/** @file Derives coarse location estimates for the private distance endpoint, separate from public presence. */

// Private distance estimates only: these details never enter the presence protocol.
export type ViewerLocation = {
  city: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
};

// Coarsen Cloudflare metadata before returning it privately to the requesting browser.
export function approximateLocation(cf?: {
  city?: unknown;
  country?: unknown;
  timezone?: unknown;
  latitude?: unknown;
  longitude?: unknown;
}): ViewerLocation | null {
  if (
    !cf ||
    typeof cf.city !== "string" ||
    !cf.city.trim() ||
    typeof cf.timezone !== "string" ||
    !cf.timezone ||
    cf.latitude == null ||
    cf.longitude == null
  )
    return null;
  const latitude = Number(cf.latitude),
    longitude = Number(cf.longitude);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    return null;
  try {
    new Intl.DateTimeFormat("en", { timeZone: cf.timezone });
  } catch {
    return null;
  }
  return {
    city: cf.city.slice(0, 100),
    country: typeof cf.country === "string" ? cf.country.slice(0, 2) : "",
    timezone: cf.timezone.slice(0, 100),
    latitude: Math.round(latitude * 2) / 2,
    longitude: Math.round(longitude * 2) / 2,
  };
}
