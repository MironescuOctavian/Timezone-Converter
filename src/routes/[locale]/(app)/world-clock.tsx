/** @file Coordinates the world-clock city list, search, shared time slider, and expandable location details. */

import { createMemo, createSignal, For, onSettled, Show } from "solid-js";
import { getLocaleInfo, t } from "@rimelight/i18n";
import {
  cities,
  displayCountry,
  flagCodes,
  differenceLabel,
  differenceMinutes,
} from "#components/timezone/data";
import { AmberClock } from "#components/timezone/Clock";
import { displayCity } from "#components/timezone/city-names";
import { CityInfo } from "#components/timezone/CityInfo";
import { CitySearch, type SearchCity } from "#components/timezone/CitySearch";
import "#components/timezone/page.css";
import timezoneCountries from "#data/timezone-countries.json";

import { TimezoneDetails } from "#components/timezone/TimezoneDetails";
import { CityTimeline, TimelineLegend } from "#components/timezone/CityTimeline";
import { timelineInstant } from "#components/timezone/timeline";
import { CityActivity } from "#components/timezone/CityActivity";
import { CountryHolidays } from "#components/timezone/CountryHolidays";
import { dateFormatter } from "#components/timezone/date-format";

// Indices refer to the curated representative cities in timezone/data.ts.
const featured = [2, 3, 13, 4, 5, 14, 15, 16, 9, 10, 11, 12, 17, 18, 20, 21, 6, 7, 8, 24];

export default function WorldClockPage() {
  const [now, setNow] = createSignal<Date>();
  const [local, setLocal] = createSignal("UTC");
  const [added, setAdded] = createSignal<SearchCity[]>([]);
  const [expanded, setExpanded] = createSignal<string>();
  const [selectedTime, setSelectedTime] = createSignal<Date>();
  const [timelineStart, setTimelineStart] = createSignal<number>();
  const shownTime = createMemo(() => selectedTime() ?? now());
  onSettled(() => {
    setLocal(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    const current = new Date();
    setNow(current);
    setTimelineStart(
      new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime(),
    );
    const tick = () => {
      if (!document.hidden) setNow(new Date());
    };
    const timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  });
  const localIndex = createMemo(() => cities.findIndex((city) => city[2] === local()));
  const rows = createMemo(() => {
    const indices = [...new Set([...(localIndex() >= 0 ? [localIndex()] : []), ...featured])];
    const result: {
      index: number;
      zone: string;
      name: string;
      countryCode?: string;
      country?: string;
      coordinates?: { latitude: number; longitude: number };
    }[] = indices.map((index) => ({
      index,
      zone: cities[index]![2]!,
      name: cities[index]![0]!,
    }));
    const country = (timezoneCountries as Record<string, string>)[local()];
    const representative = flagCodes.findIndex((flag) => flag === country);
    if (localIndex() < 0 && representative >= 0)
      result.unshift({
        index: representative,
        zone: local(),
        name: local().split("/").at(-1)!.replaceAll("_", " "),
      });
    const custom = added().map((city) => ({
      index: flagCodes.indexOf(city.country_code.toLowerCase()),
      zone: city.timezone,
      name: city.name,
      countryCode: city.country_code.toLowerCase(),
      country: city.country,
      coordinates: { latitude: city.latitude, longitude: city.longitude },
    }));
    return [
      ...custom,
      ...result.filter(
        (row) => !custom.some((city) => city.zone === row.zone && city.name === row.name),
      ),
    ];
  });
  return (
    <main class="timezone-page timezone-world-clock">
      <p class="text-xs font-bold uppercase tracking-widest text-primary-500">
        {t("timezone.aroundWorld")}
      </p>
      <h1 class="mt-3 text-4xl font-bold sm:text-5xl">
        {t("timezone.worldClock")}
        <span class="text-primary-500">.</span>
      </h1>
      <p class="mt-3 max-w-2xl opacity-70">{t("timezone.worldClockIntro")}</p>
      <div class="relative mt-8 max-w-xl">
        <p class="mb-2 block text-sm font-semibold">{t("timezone.addLocation")}</p>
        <CitySearch
          onSelect={(city) =>
            setAdded((current) => [city, ...current.filter((item) => item.id !== city.id)])
          }
        />
      </div>
      <Show
        when={now() && localIndex() < 0 && !(timezoneCountries as Record<string, string>)[local()]}
      >
        <div class="mt-8 rounded-2xl border border-primary-700 bg-neutral-50 p-5">
          <p class="text-xs font-bold uppercase tracking-widest text-primary-500">
            {t("timezone.localTime")} · {local().replaceAll("_", " ")}
          </p>
          <p class="mt-2 text-2xl font-bold">
            <AmberClock date={shownTime()} zone={local()} />
          </p>
        </div>
      </Show>
      <div class="mt-6 rounded-2xl border border-primary-700/50 bg-neutral-50 p-5">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="flex items-center gap-2 text-sm font-bold">
              <span
                class="i-lucide-sliders-horizontal size-4 text-primary-500"
                aria-hidden="true"
              />
              {t("timezone.compareTimeSlider")}
            </p>
            <p class="mt-2 text-xs opacity-65">{t("timezone.timelineHelp")}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="grid gap-1 text-right text-sm font-semibold tabular-nums">
              <small class="text-xs font-normal opacity-65">
                {shownTime()
                  ? dateFormatter(getLocaleInfo().tag, {
                      timeZone: local(),
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    }).format(shownTime()!)
                  : "—"}
              </small>
              <span>
                <AmberClock date={shownTime()} zone={local()} />
              </span>
            </span>
            <button
              type="button"
              class="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary-700 px-3 text-xs font-semibold text-primary-500"
              onClick={() => setSelectedTime(undefined)}
            >
              <span
                class={selectedTime() ? "i-lucide-radio size-4" : "i-lucide-circle-check size-4"}
                aria-hidden="true"
              />
              {selectedTime() ? t("timezone.backToLive") : t("timezone.liveNow")}
            </button>
          </div>
        </div>
        <div class="mt-4 border-t border-primary-700/30 pt-3">
          <TimelineLegend />
        </div>
      </div>
      <div class="mt-5 grid gap-3">
        <For each={rows()}>
          {(row) => {
            return (
              <article class="overflow-hidden rounded-2xl border border-primary-700/60 bg-neutral-50">
                <button
                  class="world-clock-row min-h-24 w-full p-5 text-left hover:bg-primary-500/10"
                  aria-expanded={expanded() === `${row.zone}#${row.name}` ? "true" : "false"}
                  onClick={() =>
                    setExpanded(
                      expanded() === `${row.zone}#${row.name}`
                        ? undefined
                        : `${row.zone}#${row.name}`,
                    )
                  }
                >
                  <img
                    class="h-8 w-11 rounded object-cover"
                    src={`https://flagcdn.com/w80/${row.countryCode ?? flagCodes[row.index]}.png`}
                    alt=""
                  />
                  <span class="min-w-0">
                    <strong class="block text-lg">
                      {displayCity(row.name)}, {row.country ?? displayCountry(row.index)}
                    </strong>
                    <small class="block break-words opacity-65">
                      {row.zone.replaceAll("_", " ")}
                      {row.zone === local() ? ` · ${t("timezone.yourTimezone")}` : ""}
                    </small>
                  </span>
                  <CityActivity date={shownTime()} zone={row.zone} />
                  <span class="world-clock-row-meta">
                    <span class="world-clock-row-facts">
                      <span class="inline-flex items-center gap-2">
                        <span
                          class="i-lucide-calendar-days size-4 text-primary-500"
                          aria-hidden="true"
                        />
                        {shownTime()
                          ? dateFormatter(getLocaleInfo().tag, {
                              timeZone: row.zone,
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            }).format(shownTime()!)
                          : "—"}
                      </span>
                      <span class="inline-flex items-center gap-2 text-xs opacity-65">
                        <span
                          class="i-lucide-globe-2 size-3.5 text-primary-500"
                          aria-hidden="true"
                        />
                        {shownTime()
                          ? dateFormatter(getLocaleInfo().tag, {
                              timeZone: row.zone,
                              timeZoneName: "longOffset",
                            })
                              .formatToParts(shownTime()!)
                              .find((part) => part.type === "timeZoneName")?.value
                          : "—"}
                      </span>
                    </span>
                  </span>
                  <span class="text-right">
                    <strong class="block text-2xl tabular-nums">
                      <AmberClock date={shownTime()} zone={row.zone} />
                    </strong>
                    <small class="text-primary-500">
                      {shownTime()
                        ? differenceLabel(differenceMinutes(shownTime()!, row.zone, local()))
                        : ""}
                    </small>
                  </span>
                  <span class="text-primary-500" aria-hidden="true">
                    {expanded() === `${row.zone}#${row.name}` ? "−" : "+"}
                  </span>
                </button>
                <CityTimeline
                  start={timelineStart()}
                  date={shownTime()}
                  zone={row.zone}
                  city={displayCity(row.name)}
                  onSelect={(minute) => {
                    if (timelineStart() !== undefined)
                      setSelectedTime(timelineInstant(timelineStart()!, minute));
                  }}
                />
                <Show when={expanded() === `${row.zone}#${row.name}`}>
                  <div class="flex flex-col gap-4 border-t border-primary-700/40 p-4 sm:p-5">
                    <div class="rounded-xl border border-primary-700/40 p-4">
                      <p class="mb-3 text-center text-xs font-bold uppercase tracking-widest text-primary-500">
                        ☁ {t("timezone.weatherDaylight")}
                      </p>
                      <CityInfo
                        index={row.index}
                        cityName={row.name}
                        countryCode={row.countryCode}
                        coordinates={row.coordinates}
                        zone={row.zone}
                        now={now()}
                        world
                        details
                      />
                    </div>
                    <TimezoneDetails zone={row.zone} local={local()} now={shownTime()} />
                    <CountryHolidays
                      country={row.countryCode ?? flagCodes[row.index]}
                      zone={row.zone}
                      date={shownTime()}
                    />
                  </div>
                </Show>
              </article>
            );
          }}
        </For>
      </div>
    </main>
  );
}
