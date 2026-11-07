# Country timezone data

`country-timezones.json` is a derived subset of the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database), retrieved November 7, 2026, from `json/countries.json`.

This data is made available under the [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/). It contains country identifiers, names, flag codes, regions, and one representative IANA timezone per country. Where a timezone matches the capital name, it is preferred; otherwise the first listed timezone is used. Existing featured cities retain their selected timezone. Map-specific entries for Northern Cyprus, Somaliland, and Kosovo are supplied in the page.

`timezone-countries.json` maps IANA timezone identifiers to country codes using the public-domain [IANA timezone database zone.tab](https://github.com/eggert/tz/blob/main/zone.tab), retrieved November 7, 2026.

`map-countries.json` contains only IDs and names, in the same order as the bundled `world-atlas/countries-110m.json` geometries. It preserves representative-city indices without pulling country coordinates into the World Clock page. Regenerate it when updating `world-atlas`; the map metadata tests check that every outline still has a valid city and flag. Full outlines and label geometry live in `components/timezone/geography.ts`.
