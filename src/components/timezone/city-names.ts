/** @file Normalizes city names and resolves their optional interface translations. */

import { t } from "@rimelight/i18n";

// Keep UI translation separate from the shared geography/timezone data module.
// A language change must not depend on a cached version of that large module.
export function displayCity(name: string | undefined) {
  const clean = (name ?? "").replaceAll("_", " ");
  return clean ? t.raw(`timezone.cityNames.${clean}`, clean) : "";
}
