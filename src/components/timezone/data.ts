import { geoArea, geoCentroid, geoContains } from "d3-geo";
import { t, getLocaleInfo } from "@rimelight/i18n";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import countryProfiles from "#data/country-timezones.json";
import type { GeometryCollection, Topology } from "topojson-specification";
import { dateFormatter } from "./date-format";

// IANA timezone names include daylight saving rules; cities make them easier to recognize.
const cities = [
  ["Los Angeles", "US Pacific", "America/Los_Angeles"],
  ["Chicago", "US Central", "America/Chicago"],
  ["New York", "US Eastern", "America/New_York"],
  ["London", "United Kingdom", "Europe/London"],
  ["Berlin", "Germany", "Europe/Berlin"],
  ["Bucharest", "Romania", "Europe/Bucharest"],
  ["Beijing", "China", "Asia/Shanghai"],
  ["Tokyo", "Japan", "Asia/Tokyo"],
  ["Seoul", "South Korea", "Asia/Seoul"],
  ["Toronto", "Canada", "America/Toronto"],
  ["Mexico City", "Mexico", "America/Mexico_City"],
  ["São Paulo", "Brazil", "America/Sao_Paulo"],
  ["Buenos Aires", "Argentina", "America/Argentina/Buenos_Aires"],
  ["Paris", "France", "Europe/Paris"],
  ["Madrid", "Spain", "Europe/Madrid"],
  ["Rome", "Italy", "Europe/Rome"],
  ["Istanbul", "Turkey", "Europe/Istanbul"],
  ["Cairo", "Egypt", "Africa/Cairo"],
  ["Johannesburg", "South Africa", "Africa/Johannesburg"],
  ["Nairobi", "Kenya", "Africa/Nairobi"],
  ["Dubai", "United Arab Emirates", "Asia/Dubai"],
  ["New Delhi", "India", "Asia/Kolkata"],
  ["Bangkok", "Thailand", "Asia/Bangkok"],
  ["Jakarta", "Indonesia", "Asia/Jakarta"],
  ["Sydney", "Australia", "Australia/Sydney"],
  ["Auckland", "New Zealand", "Pacific/Auckland"],
];
const flagCodes = [
  "us",
  "us",
  "us",
  "gb",
  "de",
  "ro",
  "cn",
  "jp",
  "kr",
  "ca",
  "mx",
  "br",
  "ar",
  "fr",
  "es",
  "it",
  "tr",
  "eg",
  "za",
  "ke",
  "ae",
  "in",
  "th",
  "id",
  "au",
  "nz",
];
const marqueeRows = [
  cities.filter((city) => city[2]?.startsWith("America/") || city[2]?.startsWith("Europe/")),
  cities.filter((city) => !city[2]?.startsWith("America/") && !city[2]?.startsWith("Europe/")),
];

// Compare calendar fields at the same instant, preserving date boundaries and DST.
function differenceMinutes(date: Date, destination: string, origin: string) {
  const wallTime = (zone: string) => {
    const p = zoneParts(date, zone);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  };
  return (wallTime(destination) - wallTime(origin)) / 60_000;
}

function differenceLabel(minutes: number) {
  if (minutes === 0) return t.raw("timezone.sameTime", "Same time as you");
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const remainder = absolute % 60;
  const amount = [hours ? `${hours}h` : "", remainder ? `${remainder}m` : ""]
    .filter(Boolean)
    .join(" ");
  return `${amount} ${minutes > 0 ? t.raw("timezone.ahead", "ahead of you") : t.raw("timezone.behind", "behind you")}`;
}

function clockParts(date: Date | undefined, zone: string | undefined, full = false) {
  if (!date || !zone) return [{ type: "literal", value: "—" }];
  const locale = getLocaleInfo().tag;
  const formatter = dateFormatter(
    locale,
    full
      ? { timeZone: zone, dateStyle: "full", timeStyle: "medium" }
      : { timeZone: zone, hour: "numeric", minute: "2-digit", second: "2-digit" },
  );
  return formatter.formatToParts(date);
}

// Country outlines come from Natural Earth via world-atlas. IDs link countries to the clocks above.
const countryCities: Record<string, number> = {
  "840": 2,
  "826": 3,
  "276": 4,
  "642": 5,
  "156": 6,
  "392": 7,
  "410": 8,
  "124": 9,
  "484": 10,
  "076": 11,
  "032": 12,
  "250": 13,
  "724": 14,
  "380": 15,
  "792": 16,
  "818": 17,
  "710": 18,
  "404": 19,
  "784": 20,
  "356": 21,
  "764": 22,
  "360": 23,
  "036": 24,
  "554": 25,
};
const topology = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
const countries = feature(topology, topology.objects.countries).features;
// Twenty-four 15° longitude bands approximate the world's hourly time zones.
const globeGrid: GeoJSON.MultiLineString = {
  type: "MultiLineString",
  coordinates: Array.from({ length: 24 }, (_, index) =>
    Array.from({ length: 91 }, (_, latitude) => [index * 15 - 180, latitude * 2 - 90]),
  ),
};
// Keep the curated clocks above, then supply a representative IANA zone for every map shape.
const specialProfiles: Record<string, { zone: string; flag: string }> = {
  "N. Cyprus": { zone: "Asia/Nicosia", flag: "cy" },
  Somaliland: { zone: "Africa/Mogadishu", flag: "so" },
  Kosovo: { zone: "Europe/Belgrade", flag: "xk" },
};
for (const country of countries) {
  const key = String(country.id ?? country.properties.name);
  if (countryCities[key] !== undefined) continue;
  const profile = country.id
    ? countryProfiles.find((item) => item.id === String(country.id))
    : specialProfiles[country.properties.name];
  if (!profile?.zone) throw new Error(`Missing timezone for ${country.properties.name}`);
  countryCities[key] = cities.length;
  cities.push([
    profile.zone.split("/").at(-1)!.replaceAll("_", " "),
    country.properties.name,
    profile.zone,
  ]);
  flagCodes.push(profile.flag);
}
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
const countryNamesByCode = new Map(countryProfiles.map((profile) => [profile.flag, profile.name]));
const countryName = (index: number) =>
  countryNamesByCode.get(flagCodes[index]!) ?? cities[index]?.[1] ?? "";
// Country names follow the chosen UI language; English names remain available for Wikipedia URLs.
const regionNames = new Map<string, Intl.DisplayNames>();
function displayCountry(index: number) {
  const locale = getLocaleInfo().tag;
  let names = regionNames.get(locale);
  if (!names) {
    names = new Intl.DisplayNames([locale], { type: "region" });
    regionNames.set(locale, names);
  }
  const code = flagCodes[index]?.toUpperCase();
  return code ? (names.of(code) ?? countryName(index)) : countryName(index);
}

// Read the calendar fields of an instant as they appear in a particular timezone.
function zoneParts(date: Date, zone: string) {
  const formatter = dateFormatter("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  return Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, Number(part.value)]),
  ) as {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  };
}

// Format the same instant in each selected zone without depending on browser locale.
function formatClipboardTime(date: Date, zone: string) {
  const parts = dateFormatter("en-GB", {
    timeZone: zone,
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const field = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${field("day")}/${field("month")}/${field("year")} → ${field("hour")}/${field("minute")}/${field("second")}`;
}

// A datetime-local input has no timezone. Find an instant matching its clock fields.
function toInstant(value: string, zone: string) {
  const match = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)(?::(\d\d))?$/.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]),
    month = Number(match[2]),
    day = Number(match[3]);
  const hour = Number(match[4]),
    minute = Number(match[5]),
    second = Number(match[6] ?? 0);
  const wanted = Date.UTC(year, month - 1, day, hour, minute, second);
  let guess = wanted;
  // Adjust the guess by the difference between the requested and displayed clock times.
  for (let i = 0; i < 4; i++) {
    const p = zoneParts(new Date(guess), zone);
    const difference = wanted - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    if (!difference) return new Date(guess);
    guess += difference;
  }
  // A clock time skipped by daylight saving has no matching instant.
  return undefined;
}

export {
  cities,
  flagCodes,
  marqueeRows,
  countries,
  countryCities,
  globeGrid,
  labelCountries,
  countryName,
  displayCountry,
  differenceMinutes,
  differenceLabel,
  toInstant,
  formatClipboardTime,
  clockParts,
};
