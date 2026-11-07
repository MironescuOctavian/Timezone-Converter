export type DiscordStyle = "t" | "T" | "d" | "D" | "f" | "F" | "s" | "S" | "R";

// Discord timestamps use Unix seconds, never milliseconds.
export function discordTimestamp(instant: Date, style: DiscordStyle): string {
  return `<t:${Math.floor(instant.getTime() / 1000)}:${style}>`;
}

// Approximate Discord's rendering in the visitor's timezone; Discord chooses its own locale.
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
