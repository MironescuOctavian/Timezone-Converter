import { geoDistance } from "d3-geo";
export type Coordinates = { latitude: number; longitude: number };

// Mean Earth radius (IUGG); this is a great-circle estimate, not a road route.
export function distanceKm(from: Coordinates, to: Coordinates) {
  return geoDistance([from.longitude, from.latitude], [to.longitude, to.latitude]) * 6371.0088;
}
export function convertDistance(km: number, unit: "km" | "mi") {
  return unit === "mi" ? km / 1.609344 : km;
}
