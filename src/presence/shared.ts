export type ViewerLocation = {
  city: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
};
export type ViewerCity = ViewerLocation & { key: string; viewers: number };
export type PresenceMessage =
  | { type: "welcome"; location: ViewerLocation | null }
  | { type: "snapshot"; cities: ViewerCity[]; total: number };

// Cloudflare geolocation is approximate. Coarsen it further before sharing anything.
// Do not accept browser-supplied coordinates or forward IPs to the Durable Object.
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

export function groupViewers(locations: (ViewerLocation | null)[]): ViewerCity[] {
  const cities = new Map<string, ViewerCity>();
  for (const location of locations) {
    if (!location) continue;
    const key = `${location.country}:${location.city}:${location.timezone}`;
    const existing = cities.get(key);
    if (existing) existing.viewers++;
    else cities.set(key, { ...location, key, viewers: 1 });
  }
  return [...cities.values()];
}
