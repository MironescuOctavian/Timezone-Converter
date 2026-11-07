/** @file Generates Discord timestamp markup and localized previews for the supported format options. */

/**
 * Supported Discord timestamp style flags:
 * - 't': Short Time (e.g. 9:41 AM)
 * - 'T': Long Time (e.g. 9:41:30 AM)
 * - 'd': Short Date (e.g. 10/24/2026)
 * - 'D': Long Date (e.g. October 24, 2026)
 * - 'f': Short Date/Time (e.g. October 24, 2026 9:41 AM)
 * - 'F': Long Date/Time (e.g. Saturday, October 24, 2026 9:41 AM)
 * - 's': Short Date/Time without day of week
 * - 'S': Short Date/Time with seconds
 * - 'R': Relative Time (e.g. in 2 hours, 5 minutes ago)
 */
export type DiscordStyle = "t" | "T" | "d" | "D" | "f" | "F" | "s" | "S" | "R";

/**
 * Generate a Discord markdown timestamp snippet `<t:epoch:style>`.
 * Note: Discord timestamps strictly require Unix epoch timestamps in whole seconds, not milliseconds.
 */
export function discordTimestamp(instant: Date, style: DiscordStyle): string {
  return `<t:${Math.floor(instant.getTime() / 1000)}:${style}>`;
}

/**
 * Preview how Discord will render the timestamp on an end-user's device.
 * For style 'R' (relative), uses `Intl.RelativeTimeFormat`.
 * For all other styles, formats using `Intl.DateTimeFormat` with options matching Discord client defaults.
 */
export function discordPreview(
  instant: Date,
  style: DiscordStyle,
  zone: string,
  locale: string,
): string {
  if (style === "R") {
    const seconds = (instant.getTime() - Date.now()) / 1000;
    const [unit, divisor] =
      Math.abs(seconds) < 60
        ? ["second", 1]
        : Math.abs(seconds) < 3600
          ? ["minute", 60]
          : Math.abs(seconds) < 86400
            ? ["hour", 3600]
            : ["day", 86400];
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      Math.round(seconds / (divisor as number)),
      unit as Intl.RelativeTimeFormatUnit,
    );
  }
  const options: Record<Exclude<DiscordStyle, "R">, Intl.DateTimeFormatOptions> = {
    t: { hour: "numeric", minute: "2-digit" },
    T: { hour: "numeric", minute: "2-digit", second: "2-digit" },
    d: { dateStyle: "short" },
    D: { dateStyle: "long" },
    f: { dateStyle: "long", timeStyle: "short" },
    F: { dateStyle: "full", timeStyle: "short" },
    s: { dateStyle: "short", timeStyle: "short" },
    S: { dateStyle: "short", timeStyle: "medium" },
  };
  return new Intl.DateTimeFormat(locale, { ...options[style], timeZone: zone }).format(instant);
}
