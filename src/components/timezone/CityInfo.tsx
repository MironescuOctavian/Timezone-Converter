import { t } from "@rimelight/i18n";
import { createEffect, createSignal, Show } from "solid-js";
import { geoDistance } from "d3-geo";
import { cities, flagCodes } from "./data";
import { displayCity } from "./city-names";
import { AmberClock } from "./Clock";
import { PhotoGallery } from "./PhotoGallery";
import { CityDistance } from "./Distance";

type CityInfoData = {
  temperature?: number;
  weatherCode?: number;
  description?: string;
  extract?: string;
  photo?: string;
  photoPage?: string;
  article?: string;
  sunrise?: string;
  sunset?: string;
  daylight?: number;
  latitude?: number;
  longitude?: number;
  elevation?: number;
};
// Weather changes over time; keep resolved responses for ten minutes, not pending requests.
const cityInfoCache = new Map<string, { data: CityInfoData; fetchedAt: number }>();
function weatherDescription(code: number) {
  if (code === 0) return t.raw("timezone.clear", "Clear sky");
  if (code <= 3) return t.raw("timezone.cloudy", "Partly cloudy");
  if (code <= 49) return t.raw("timezone.fog", "Foggy");
  if (code <= 67) return t.raw("timezone.rain", "Rain");
  if (code <= 77) return t.raw("timezone.snow", "Snow");
  if (code <= 82) return t.raw("timezone.rainShowers", "Rain showers");
  if (code <= 86) return t.raw("timezone.snowShowers", "Snow showers");
  return t.raw("timezone.thunderstorms", "Thunderstorms");
}

export function CityInfo(props: {
  index: number;
  details?: boolean;
  cityName?: string | undefined;
  world?: boolean;
  now?: Date | undefined;
  zone?: string | undefined;
  countryCode?: string | undefined;
  coordinates?: { latitude: number; longitude: number } | undefined;
}) {
  const [data, setData] = createSignal<CityInfoData | undefined>();
  const [loading, setLoading] = createSignal(false);
  createEffect(
    () =>
      [
        props.index,
        props.cityName,
        props.details,
        props.world,
        props.countryCode,
        props.coordinates,
      ] as const,
    ([index, selectedName, details, world, countryCode, coordinates]) => {
      const city = cities[index];
      const name = (selectedName ?? city?.[0] ?? "").replaceAll("_", " ");
      const flag = countryCode ?? flagCodes[index];
      const key = `${name}:${flag}:${coordinates?.latitude ?? ""}:${coordinates?.longitude ?? ""}:${!!details}:${!!world}`;
      const cached = cityInfoCache.get(key);
      if (cached && Date.now() - cached.fetchedAt < 600_000) {
        setData(cached.data);
        setLoading(false);
        return;
      }
      setData(undefined);
      setLoading(true);
      // Debounce pointer movement and cancel stale requests when the city changes.
      const controller = new AbortController();
      const timer = setTimeout(async () => {
        try {
          let location: { latitude: number; longitude: number; elevation?: number } | undefined =
            coordinates;
          if (!location) {
            const params = new URLSearchParams({
              name,
              count: "10",
              language: "en",
              format: "json",
            });
            const response = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?${params}`,
              { signal: controller.signal },
            );
            if (!response.ok) throw new Error("Location unavailable");
            const locations = (await response.json()) as {
              results?: {
                latitude: number;
                longitude: number;
                elevation?: number;
                country_code: string;
              }[];
            };
            location = locations.results?.find((item) => item.country_code.toLowerCase() === flag);
          }
          if (!location) throw new Error("Location unavailable");
          const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
          weatherUrl.search = new URLSearchParams({
            latitude: String(location.latitude),
            longitude: String(location.longitude),
            current: "temperature_2m,weather_code",
            ...(world ? { daily: "sunrise,sunset,daylight_duration", forecast_days: "1" } : {}),
            timezone: "auto",
          }).toString();
          const wikiParams = new URLSearchParams({
            action: "query",
            prop: "extracts|pageimages|coordinates",
            titles: name === "New York" ? "New York City" : name,
            exintro: "1",
            explaintext: "1",
            exsentences: "5",
            piprop: "thumbnail|name",
            pithumbsize: "960",
            redirects: "1",
            format: "json",
            formatversion: "2",
            origin: "*",
          });
          const [weatherResult, wikiResult] = await Promise.allSettled([
            fetch(weatherUrl, { signal: controller.signal }).then((result) => {
              if (!result.ok) throw new Error("Weather unavailable");
              return result.json();
            }),
            details
              ? fetch(`https://en.wikipedia.org/w/api.php?${wikiParams}`, {
                  signal: controller.signal,
                }).then((result) => {
                  if (!result.ok) throw new Error("City details unavailable");
                  return result.json();
                })
              : Promise.reject(new Error("City details not requested")),
          ]);
          const info: CityInfoData = { latitude: location.latitude, longitude: location.longitude };
          if (typeof location.elevation === "number") info.elevation = location.elevation;
          if (weatherResult.status === "fulfilled") {
            const weather = weatherResult.value as {
              current?: { temperature_2m?: number; weather_code?: number };
              daily?: { sunrise?: string[]; sunset?: string[]; daylight_duration?: number[] };
            };
            if (typeof weather.current?.temperature_2m === "number")
              info.temperature = weather.current.temperature_2m;
            if (weather.daily?.sunrise?.[0]) info.sunrise = weather.daily.sunrise[0];
            if (weather.daily?.sunset?.[0]) info.sunset = weather.daily.sunset[0];
            if (weather.daily?.daylight_duration?.[0] !== undefined)
              info.daylight = weather.daily.daylight_duration[0];
            if (typeof weather.current?.weather_code === "number") {
              info.weatherCode = weather.current.weather_code;
              info.description = weatherDescription(weather.current.weather_code);
            }
          }
          if (wikiResult.status === "fulfilled") {
            const wiki = wikiResult.value as {
              query?: {
                pages?: {
                  title?: string;
                  extract?: string;
                  thumbnail?: { source: string };
                  pageimage?: string;
                  coordinates?: { lat: number; lon: number }[];
                }[];
              };
            };
            const page = wiki.query?.pages?.[0];
            const coordinate = page?.coordinates?.[0];
            // Shared names can otherwise point to an unrelated Wikipedia article.
            if (
              page?.title &&
              coordinate &&
              geoDistance(
                [location.longitude, location.latitude],
                [coordinate.lon, coordinate.lat],
              ) < 0.015
            ) {
              if (page.extract) info.extract = page.extract;
              if (page.thumbnail?.source) info.photo = page.thumbnail.source;
              if (page.pageimage)
                info.photoPage = `https://en.wikipedia.org/wiki/File:${encodeURIComponent(page.pageimage.replaceAll(" ", "_"))}`;
              info.article = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(" ", "_"))}`;
            }
          }
          if (!controller.signal.aborted) {
            if (info.temperature !== undefined || info.extract || info.photo)
              cityInfoCache.set(key, { data: info, fetchedAt: Date.now() });
            setData(info);
            setLoading(false);
          }
        } catch {
          if (!controller.signal.aborted) {
            setData({});
            setLoading(false);
          }
        }
      }, 500);
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    },
  );
  return (
    <div class="city-info">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-neutral-950">
        <Show when={props.zone}>
          <span class="inline-flex items-center gap-1.5 font-semibold tabular-nums">
            <span class="i-lucide-clock-3 size-4 text-primary-500" aria-hidden="true" />
            <AmberClock date={props.now} zone={props.zone} />
          </span>
        </Show>
        <p class="flex items-center gap-2 text-sm font-medium text-neutral-950">
          <Show
            when={!loading() && data()?.temperature !== undefined}
            fallback={
              loading()
                ? t.raw("timezone.checkingWeather", "Checking current weather…")
                : t.raw("timezone.weatherUnavailable", "Current weather unavailable")
            }
          >
            <span
              class={`weather-icon text-lg text-primary-500 ${(data()?.weatherCode ?? 0) === 0 ? "weather-sun" : ((data()?.weatherCode ?? 0) >= 51 && (data()?.weatherCode ?? 0) <= 67) || ((data()?.weatherCode ?? 0) >= 80 && (data()?.weatherCode ?? 0) <= 82) ? "weather-rain" : (data()?.weatherCode ?? 0) >= 71 && (data()?.weatherCode ?? 0) <= 86 ? "weather-snow" : ""}`}
              aria-hidden="true"
            >
              {data()?.weatherCode === 0
                ? "☀"
                : (data()?.weatherCode ?? 0) <= 49
                  ? "☁"
                  : (data()?.weatherCode ?? 0) <= 67
                    ? "☂"
                    : (data()?.weatherCode ?? 0) <= 77 ||
                        ((data()?.weatherCode ?? 0) >= 85 && (data()?.weatherCode ?? 0) <= 86)
                      ? "❄"
                      : (data()?.weatherCode ?? 0) <= 82
                        ? "☂"
                        : "ϟ"}
            </span>
            <span class="font-bold text-primary-500">{Math.round(data()!.temperature!)}°C</span>
            <span>
              ·{" "}
              {data()?.weatherCode !== undefined
                ? weatherDescription(data()!.weatherCode!)
                : t.raw("timezone.currentWeather", "Current weather")}
            </span>
          </Show>
        </p>
        <Show when={props.details}>
          <CityDistance
            coordinates={
              data()?.latitude !== undefined && data()?.longitude !== undefined
                ? { latitude: data()!.latitude!, longitude: data()!.longitude! }
                : undefined
            }
          />
        </Show>
      </div>
      <Show when={props.world && data()?.sunrise && data()?.sunset}>
        <div class="mt-4 grid grid-cols-3 gap-2 text-sm">
          <p>
            <span aria-hidden="true">🌅</span> {t.raw("timezone.sunrise", "Sunrise")}
            <br />
            <strong>{data()!.sunrise!.slice(11, 16)}</strong>
          </p>
          <p>
            <span aria-hidden="true">🌇</span> {t.raw("timezone.sunset", "Sunset")}
            <br />
            <strong>{data()!.sunset!.slice(11, 16)}</strong>
          </p>
          <p>
            <span aria-hidden="true">☀</span> {t.raw("timezone.dayLength", "Day length")}
            <br />
            <strong>
              {Math.floor((data()!.daylight ?? 0) / 3600)}h{" "}
              {Math.floor(((data()!.daylight ?? 0) % 3600) / 60)}m
            </strong>
          </p>
        </div>
      </Show>
      <Show when={props.world && data()?.latitude !== undefined && data()?.longitude !== undefined}>
        <p class="mt-4 text-xs opacity-70">
          {t.raw("timezone.coordinates", "Coordinates")}: {data()!.latitude!.toFixed(2)}°,{" "}
          {data()!.longitude!.toFixed(2)}°
          <Show when={data()?.elevation !== undefined}>
            {" "}
            · {t.raw("timezone.elevation", "Elevation")}: {Math.round(data()!.elevation!)} m
          </Show>
        </p>
      </Show>
      <Show when={props.details && data()?.extract}>
        <div class="mt-5 grid gap-6 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Show when={data()?.photo && data()?.photoPage && data()?.article}>
            <PhotoGallery
              src={data()!.photo!}
              page={data()!.photoPage!}
              article={data()!.article!}
              title={displayCity(props.cityName ?? cities[props.index]?.[0])}
            />
          </Show>
          <div class="flex flex-col items-start">
            <p class="text-xs font-bold uppercase tracking-widest text-primary-500">
              {t.raw("timezone.aboutCity", "A little about")}{" "}
              {displayCity(props.cityName ?? cities[props.index]?.[0])}
            </p>
            <p class="mt-3 text-sm leading-relaxed text-neutral-950/80">{data()?.extract}</p>
            <a
              href={data()?.article}
              target="_blank"
              rel="noopener noreferrer"
              class="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-primary-500 hover:text-primary-400"
            >
              {t.raw("timezone.readMore", "Read more on Wikipedia")}
              <span class="i-lucide-arrow-up-right size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </Show>
      <Show when={props.details && !loading() && !data()?.extract}>
        <p class="mt-3 text-sm opacity-65">
          {t.raw(
            "timezone.cityUnavailable",
            "City details and photo are unavailable for this location.",
          )}
        </p>
      </Show>
    </div>
  );
}
