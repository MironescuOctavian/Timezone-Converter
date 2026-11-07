/**
 * Continent-level geographical anchors for visitor presence markers.
 * Centered coordinates are used rather than precise user locations to protect privacy.
 */
export const REGIONS = {
  AF: { label: "continentAfrica", latitude: 2, longitude: 20 },
  AS: { label: "continentAsia", latitude: 35, longitude: 90 },
  EU: { label: "continentEurope", latitude: 52, longitude: 15 },
  NA: { label: "continentNorthAmerica", latitude: 45, longitude: -100 },
  SA: { label: "continentSouthAmerica", latitude: -15, longitude: -60 },
  OC: { label: "continentOceania", latitude: -25, longitude: 135 },
  AN: { label: "continentPolar", latitude: -80, longitude: 0 },
} as const;

export type RegionCode = keyof typeof REGIONS;

/** Minimum number of active viewers in a region required before showing a presence marker (k-anonymity) */
export const MIN_REGION_VIEWERS = 5;

/** Periodic batching interval for presence broadcast updates (25 seconds) */
export const PRESENCE_INTERVAL = 25_000;

/** State attached to each hibernated WebSocket connection in Cloudflare Workers */
export type PresenceAttachment = { version: 2; region: RegionCode | null };

/** Aggregated viewer cluster displayed on the globe */
export type ViewerRegion = {
  key: RegionCode;
  latitude: number;
  longitude: number;
  viewers: number;
};

/** Batched presence message payload broadcast to clients */
export type PresenceSnapshot = {
  type: "snapshot";
  ready: boolean;
  regions: ViewerRegion[];
  total: number;
};

export type PresenceMessage = PresenceSnapshot | { type: "welcome"; sharing: boolean };

/**
 * Validate and cast a value to a recognized RegionCode.
 */
export function regionCode(value: unknown): RegionCode | null {
  return typeof value === "string" && Object.hasOwn(REGIONS, value) ? (value as RegionCode) : null;
}

/**
 * Type guard for validating deserialized WebSocket attachments.
 */
export function isPresenceAttachment(value: unknown): value is PresenceAttachment {
  if (!value || typeof value !== "object") return false;
  const attachment = value as PresenceAttachment;
  return (
    Object.keys(value).length === 2 &&
    attachment.version === 2 &&
    (attachment.region === null || regionCode(attachment.region) !== null)
  );
}

/**
 * Bin counts down to the nearest multiple of `MIN_REGION_VIEWERS` (5)
 * to prevent micro-fluctuation tracking of individuals.
 */
export function connectionBand(count: number) {
  return Math.floor(count / MIN_REGION_VIEWERS) * MIN_REGION_VIEWERS;
}

export function regionSnapshot(attachments: PresenceAttachment[]): PresenceSnapshot {
  const counts = new Map<RegionCode, number>();
  for (const { region } of attachments)
    if (region) counts.set(region, (counts.get(region) ?? 0) + 1);
  return {
    type: "snapshot",
    ready: true,
    total: connectionBand(attachments.length),
    regions: [...counts]
      .filter(([, count]) => count >= MIN_REGION_VIEWERS)
      .map(([key, count]) => ({
        key,
        latitude: REGIONS[key].latitude,
        longitude: REGIONS[key].longitude,
        viewers: connectionBand(count),
      })),
  };
}
// Withdrawal can reduce/remove published clusters, but must not reveal pending arrivals.
export function withdrawSnapshot(
  published: PresenceSnapshot,
  current: PresenceSnapshot,
): PresenceSnapshot {
  return {
    ...published,
    total: Math.min(published.total, current.total),
    regions: published.regions.flatMap((region) => {
      const next = current.regions.find((item) => item.key === region.key);
      return next ? [{ ...region, viewers: Math.min(region.viewers, next.viewers) }] : [];
    }),
  };
}
