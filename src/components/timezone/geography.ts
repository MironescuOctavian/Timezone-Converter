/** @file Loads map outlines and prepares country centroids, label priorities, and longitude grid geometry. */

import { geoArea, geoCentroid, geoContains } from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import countryProfiles from "#data/country-timezones.json";
import type { GeometryCollection, Topology } from "topojson-specification";

const topology = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
const countries = feature(topology, topology.objects.countries).features;
// Twenty-four 15° longitude bands approximate the world's hourly time zones.
const globeGrid: GeoJSON.MultiLineString = {
  type: "MultiLineString",
  coordinates: Array.from({ length: 24 }, (_, index) =>
    Array.from({ length: 91 }, (_, latitude) => [index * 15 - 180, latitude * 2 - 90]),
  ),
};
const labelCountries = countries
  .map((country) => {
    let centroid = geoCentroid(country);
    if (!geoContains(country, centroid) && country.geometry.type === "MultiPolygon") {
      const largest = country.geometry.coordinates
        .map((coordinates) => ({ type: "Polygon" as const, coordinates }))
        .sort((a, b) => geoArea(b) - geoArea(a))[0];
      if (largest) centroid = geoCentroid(largest);
    }
    const name =
      countryProfiles.find((profile) => profile.id === String(country.id))?.name ??
      country.properties.name;
    return { country, area: geoArea(country), centroid, name };
  })
  .sort((a, b) => b.area - a.area);

export { countries, globeGrid, labelCountries };
