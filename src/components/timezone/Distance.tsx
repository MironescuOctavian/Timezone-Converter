import { createContext, createMemo, createSignal, onSettled, useContext } from "solid-js";
import type { JSX } from "@solidjs/web";
import { getLocaleInfo, t } from "@rimelight/i18n";
import timezoneCountries from "#data/timezone-countries.json";
import { convertDistance, distanceKm, type Coordinates } from "./city-distance";
import { fetchPublicJson } from "./fetch-json";

type Origin = Coordinates & { city: string; inferred?: boolean };
const DistanceContext = createContext<ReturnType<typeof createDistance>>();

/**
 * Distance Provider & State Manager.
 *
 * Resolves the visitor's approximate origin location:
 * 1. Primary: Queries edge endpoint `/api/location` (derived from Cloudflare CF geo headers).
 * 2. Fallback: If edge location is unavailable or localhost, resolves visitor's browser timezone
 *    (`Intl.DateTimeFormat().resolvedOptions().timeZone`) and queries Open-Meteo geocoding.
 * Provides distance calculations (km/miles) to target cities across the application.
 */
function createDistance() {

  const [origin, setOrigin] = createSignal<Origin>();
  const [unit, setUnit] = createSignal<"km" | "mi">("km");
  const [loading, setLoading] = createSignal(true);
  onSettled(() => {
    const controller = new AbortController();
    try {
      if (localStorage.getItem("distance-unit") === "mi") setUnit("mi");
    } catch {
      /* Optional preference. */
    }
    void (async () => {
      try {
        const response = await fetch("/api/location", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (response.ok) {
          const value = (await response.json()) as Origin | null;
          if (value) {
            if (!controller.signal.aborted) setOrigin(value);
            return;
          }
        }
        // A timezone identifies a representative city, not a precise hometown.
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const country = (timezoneCountries as Record<string, string>)[zone];
        if (!country) return;
        const city = zone.split("/").at(-1)!.replaceAll("_", " ");
        const params = new URLSearchParams({
          name: city,
          count: "20",
          language: "en",
          format: "json",
        });
        const data = (await fetchPublicJson(
          `https://geocoding-api.open-meteo.com/v1/search?${params}`,
          controller.signal,
        )) as {
          results?: (Coordinates & { name: string; country_code: string; timezone?: string })[];
        };
        const match = data.results?.find(
          (item) => item.country_code.toLowerCase() === country && item.timezone === zone,
        );
        if (match && !controller.signal.aborted)
          setOrigin({
            latitude: match.latitude,
            longitude: match.longitude,
            city: match.name.replaceAll("_", " "),
            inferred: true,
          });
      } catch {
        /* Missing location leaves an honest unavailable state. */
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  });
  return {
    origin,
    unit,
    loading,
    changeUnit(value: "km" | "mi") {
      setUnit(value);
      try {
        localStorage.setItem("distance-unit", value);
      } catch {
        /* Still works for this visit. */
      }
    },
  };
}

export function DistanceProvider(props: { children?: JSX.Element }) {
  return <DistanceContext value={createDistance()}>{props.children}</DistanceContext>;
}

export function CityDistance(props: { coordinates?: Coordinates | undefined }) {
  const distance = useContext(DistanceContext);
  const value = createMemo(() => {
    const origin = distance.origin();
    return origin && props.coordinates
      ? convertDistance(distanceKm(origin, props.coordinates), distance.unit())
      : undefined;
  });
  return (
    <span
      class="inline-flex flex-wrap items-center gap-2 text-sm font-medium"
      title={
        distance.origin()
          ? `Approximate straight-line distance from ${distance.origin()!.city}${distance.origin()!.inferred ? " (estimated from your timezone)" : " (approximate network location)"}`
          : "Your city could not be determined"
      }
    >
      <span class="i-lucide-route size-4 shrink-0 text-primary-500" aria-hidden="true" />
      <span class="tabular-nums">
        {value() !== undefined
          ? `≈ ${new Intl.NumberFormat(getLocaleInfo().tag, { maximumFractionDigits: 0 }).format(value()!)} ${distance.unit()}`
          : distance.loading()
            ? t("timezone.locatingDistance")
            : t("timezone.distanceUnavailable")}
      </span>
      <span
        class="inline-flex overflow-hidden rounded-md border border-primary-700/50 p-0.5"
        role="group"
        aria-label={t("timezone.distanceUnit")}
      >
        {(["km", "mi"] as const).map((unit) => (
          <button
            type="button"
            class={`rounded px-1.5 py-0.5 text-[10px] font-bold ${distance.unit() === unit ? "bg-primary-500 text-black" : "text-neutral-950/60 hover:text-primary-500"}`}
            aria-pressed={distance.unit() === unit ? "true" : "false"}
            onClick={() => distance.changeUnit(unit)}
          >
            {unit}
          </button>
        ))}
      </span>
    </span>
  );
}
