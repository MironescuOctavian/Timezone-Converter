/** @file Caches Intl date formatters to avoid recreating them for frequently updated clocks. */

// Reuse ICU formatters across ticking clocks. Bound the cache because visitors
// can search arbitrary zones and switch languages without reloading the app.
const formatters = new Map<string, Intl.DateTimeFormat>();
const maximumFormatters = 128;

export function dateFormatter(locale: string, options: Intl.DateTimeFormatOptions) {
  const entries = Object.entries(options).sort(([a], [b]) => a.localeCompare(b));
  const key = JSON.stringify([locale, entries]);
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    if (formatters.size >= maximumFormatters) formatters.delete(formatters.keys().next().value!);
    formatters.set(key, formatter);
  }
  return formatter;
}
