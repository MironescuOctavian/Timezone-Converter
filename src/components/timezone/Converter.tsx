import { DateTimeField } from "./DateTimeField";
import { SearchToolbar } from "./CitySearch";
import { getLocaleInfo, t } from "@rimelight/i18n";
import { createEffect, createMemo, createSignal, Show } from "solid-js";
import { RLButton } from "@rimelight/ui";
import { cities, flagCodes, formatClipboardTime } from "./data";
import { displayCity } from "./city-names";
import timezoneCountries from "#data/timezone-countries.json";
import countryProfiles from "#data/country-timezones.json";
import { AmberClock } from "./Clock";
import { CityInfo } from "./CityInfo";
import { DiscordConverter } from "./DiscordConverter";
import { TimezoneOptions } from "./TimezoneOptions";
import { TimezoneSelect } from "./TimezoneSelect";

type Place = {
  zone: string;
  flag: string;
  label: string;
  region: string;
  city: string;
  value?: string;
  coordinates?: { latitude: number; longitude: number };
};

export function Converter(props: {
  date: string;
  from: string;
  to: string;
  local: string;
  convertedCity: number | undefined;
  instant: Date | undefined;
  now: Date | undefined;
  copyStatus: string;
  destinationIndex: number | undefined;
  setDate: (value: string) => void;
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
  setConvertedCity: (value: number | undefined) => void;
  setCopyStatus: (value: string) => void;
  copy: () => void;
  sectionRef: (element: HTMLElement) => void;
  destinationRef: (element: HTMLElement) => void;
}) {
  const [mode, setMode] = createSignal<"regular" | "discord">("regular");
  const [search, setSearch] = createSignal("");
  const [remotePlaces, setRemotePlaces] = createSignal<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = createSignal<Place>();
  const [selectedFlag, setSelectedFlag] = createSignal<string>();
  const [sourceFlag, setSourceFlag] = createSignal<string>();
  const [sourcePlace, setSourcePlace] = createSignal<string>();
  // Globe actions open the regular converter with the chosen destination.
  createEffect(
    () => props.convertedCity,
    (city) => {
      if (city !== undefined) {
        setMode("regular");
        setSelectedFlag(undefined);
        setSelectedPlace(undefined);
        setSearch("");
      }
    },
  );
  // Keep every mapped IANA timezone, using the country before the city.
  const searchOptions = createMemo(() => {
    const names = new Intl.DisplayNames([getLocaleInfo().tag], { type: "region" });
    const regions = new Map(countryProfiles.map((country) => [country.flag, country.region]));
    const mapped = Object.entries(timezoneCountries).map(([zone, flag]) => ({ zone, flag }));
    const present = new Set(mapped.map((item) => item.flag));
    // A few territories share another country's IANA zone and have no separate entry.
    for (const country of countryProfiles)
      if (!present.has(country.flag)) mapped.push({ zone: country.zone, flag: country.flag });
    const southAmerica = new Set([
      "ar",
      "bo",
      "br",
      "cl",
      "co",
      "ec",
      "fk",
      "gf",
      "gy",
      "pe",
      "py",
      "sr",
      "uy",
      "ve",
    ]);
    const items: Place[] = mapped
      .map(({ zone, flag }) => {
        const known = cities.findIndex(
          (city, index) => city[2] === zone && flagCodes[index] === flag,
        );
        const city =
          known >= 0 ? cities[known]![0]! : (zone.split("/").at(-1) ?? zone).replaceAll("_", " ");
        const country = names.of(flag.toUpperCase()) ?? flag.toUpperCase();
        const area = regions.get(flag) || "Other";
        const region =
          area === "Americas" ? (southAmerica.has(flag) ? "South America" : "North America") : area;
        return { zone, flag, city, label: `${country} · ${displayCity(city)}`, region };
      })
      .sort((a, b) => a.label.localeCompare(b.label, getLocaleInfo().tag));
    items.push({
      zone: "America/Sao_Paulo",
      flag: "br",
      city: "Curitiba",
      label: `${names.of("BR") ?? "Brazil"} · Curitiba`,
      region: "South America",
      value: "America/Sao_Paulo#Curitiba",
    });
    return items.sort((a, b) => a.label.localeCompare(b.label, getLocaleInfo().tag));
  });
  // Search major cities beyond the representative timezone list. Cancel stale requests as the user types.
  createEffect(
    () => search().trim(),
    (query) => {
      if (query.length < 2 || query.includes(" (")) {
        setRemotePlaces([]);
        return;
      }
      const controller = new AbortController();
      const timer = setTimeout(async () => {
        try {
          const params = new URLSearchParams({
            name: query,
            count: "100",
            language: "en",
            format: "json",
          });
          const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("Location search unavailable");
          const data = (await response.json()) as {
            results?: {
              id: number;
              name: string;
              country?: string;
              country_code?: string;
              timezone?: string;
              population?: number;
              admin1?: string;
              latitude: number;
              longitude: number;
            }[];
          };
          const names = new Intl.DisplayNames([getLocaleInfo().tag], { type: "region" });
          const profiles = new Map(
            countryProfiles.map((country) => [country.flag, country.region]),
          );
          const results = (data.results ?? [])
            .filter((item) => item.timezone && item.country_code)
            .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
            .slice(0, 20)
            .map((item) => {
              const flag = item.country_code!.toLowerCase();
              const zone = item.timezone!;
              const country = names.of(flag.toUpperCase()) ?? item.country ?? flag.toUpperCase();
              const city = item.name;
              const area = profiles.get(flag) || "Other";
              const south = new Set([
                "ar",
                "bo",
                "br",
                "cl",
                "co",
                "ec",
                "fk",
                "gf",
                "gy",
                "pe",
                "py",
                "sr",
                "uy",
                "ve",
              ]);
              const region =
                area === "Americas" ? (south.has(flag) ? "South America" : "North America") : area;
              return {
                zone,
                flag,
                city,
                region,
                coordinates: { latitude: item.latitude, longitude: item.longitude },
                label: `${country} · ${displayCity(city)}${item.admin1 ? `, ${item.admin1}` : ""}`,
                value: `${zone}#${encodeURIComponent(city)}@${item.id}`,
              };
            });
          if (!controller.signal.aborted) setRemotePlaces(results);
        } catch {
          if (!controller.signal.aborted) setRemotePlaces([]);
        }
      }, 300);
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    },
  );
  const suggestions = createMemo(() => [...searchOptions(), ...remotePlaces()]);
  const completion = createMemo(() => {
    const query = search().trim().toLocaleLowerCase();
    if (query.length < 2 || query.includes(" (")) return undefined;
    return suggestions().find(
      (item) =>
        item.city.toLocaleLowerCase().startsWith(query) ||
        item.label.toLocaleLowerCase().startsWith(query),
    );
  });
  const groups = createMemo(() =>
    [
      { key: "Africa", label: t.raw("timezone.continentAfrica", "Africa") },
      { key: "Asia", label: t.raw("timezone.continentAsia", "Asia") },
      { key: "Europe", label: t.raw("timezone.continentEurope", "Europe") },
      { key: "North America", label: t.raw("timezone.continentNorthAmerica", "North America") },
      { key: "South America", label: t.raw("timezone.continentSouthAmerica", "South America") },
      { key: "Oceania", label: t.raw("timezone.continentOceania", "Oceania") },
      { key: "Polar", label: t.raw("timezone.continentPolar", "Polar regions") },
      { key: "Other", label: t.raw("timezone.continentOther", "Other territories") },
    ]
      .map((region) => ({
        label: region.label,
        options: [
          ...searchOptions(),
          ...(selectedPlace() &&
          !searchOptions().some(
            (item) =>
              item.zone === selectedPlace()!.zone &&
              (selectedPlace()!.value
                ? item.value === selectedPlace()!.value
                : item.label === selectedPlace()!.label),
          )
            ? [selectedPlace()!]
            : []),
        ]
          .filter((item) => item.region === region.key)
          .sort((a, b) => a.label.localeCompare(b.label, getLocaleInfo().tag)),
      }))
      .filter((group) => group.options.length),
  );
  const localLabel = () => {
    const flag = (timezoneCountries as Record<string, string>)[props.local];
    const country = flag
      ? new Intl.DisplayNames([getLocaleInfo().tag], { type: "region" }).of(flag.toUpperCase())
      : undefined;
    const city = props.local.split("/").at(-1)?.replaceAll("_", " ") ?? props.local;
    return country ? `${country} · ${displayCity(city)}` : displayCity(city);
  };
  const optionFlag = (zone: string, preferred: string | undefined) =>
    preferred && searchOptions().some((item) => item.zone === zone && item.flag === preferred)
      ? preferred
      : (timezoneCountries as Record<string, string>)[zone];
  const destinationIndex = createMemo(() => {
    const flag = selectedFlag();
    if (
      flag &&
      (suggestions().some((item) => item.zone === props.to && item.flag === flag) ||
        (selectedPlace()?.zone === props.to && selectedPlace()?.flag === flag))
    ) {
      const index = flagCodes.findIndex((code) => code === flag);
      return index >= 0 ? index : undefined;
    }
    return props.destinationIndex;
  });
  const destinationLabel = createMemo(() => {
    if (selectedPlace()?.zone === props.to) return selectedPlace()!.label;
    const entries = searchOptions().filter((item) => item.zone === props.to);
    return (
      (entries.find((item) => item.flag === optionFlag(props.to, selectedFlag())) ?? entries[0])
        ?.label ?? props.to.replaceAll("_", " ")
    );
  });
  const toValue = () =>
    selectedPlace()?.zone === props.to && selectedPlace()?.value
      ? selectedPlace()!.value!
      : searchOptions().some((item) => item.zone === props.to)
        ? props.to
        : "__local__";
  const fromValue = () =>
    sourcePlace()?.startsWith(`${props.from}#`)
      ? sourcePlace()!
      : props.from === props.local
        ? "__local__"
        : props.from;
  function selectSearch(value: string) {
    const match = suggestions().find(
      (item) =>
        `${item.label} (${item.zone})`.toLocaleLowerCase() === value.trim().toLocaleLowerCase() ||
        item.zone.toLocaleLowerCase() === value.trim().toLocaleLowerCase(),
    );
    if (!match) return;
    props.setTo(match.zone);
    setSelectedFlag(match.flag);
    setSelectedPlace(
      match.value || searchOptions().includes(match)
        ? match
        : { ...match, value: `${match.zone}#${encodeURIComponent(match.city)}` },
    );
    props.setConvertedCity(undefined);
    props.setCopyStatus("");
    setSearch(`${match.label} (${match.zone})`);
  }
  const convertedDay = createMemo(() => {
    if (!props.instant) return "";
    const parts = new Intl.DateTimeFormat(getLocaleInfo().tag, {
      timeZone: props.to,
      weekday: "long",
      month: "long",
    }).formatToParts(props.instant);
    return `${parts.find((part) => part.type === "weekday")?.value ?? ""}, ${parts.find((part) => part.type === "month")?.value ?? ""}`;
  });
  const convertedParts = createMemo(() =>
    props.instant ? formatClipboardTime(props.instant, props.to).split(" → ") : [],
  );
  return (
    <section
      ref={(element) => {
        props.sectionRef(element);
      }}
      id="converter"
      class="min-w-0 scroll-mt-24"
      aria-labelledby="converter-title"
    >
      <div class="section-heading">
        <p class="text-xs font-bold tracking-widest text-primary-500">
          {t.raw("timezone.conversionEyebrow", "World Clock Conversion")}
        </p>
        <h2 id="converter-title" class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {t.raw("timezone.conversionHeading", "Find the timezone you want.")}
        </h2>
        <p class="mt-3 max-w-2xl text-base leading-relaxed text-neutral-950 sm:text-lg">
          {t.raw(
            "timezone.conversionDescription",
            "Choose the time and places you want to convert.",
          )}
        </p>
      </div>
      <div class="overflow-hidden rounded-3xl border border-primary-700 bg-neutral-50 shadow-[0_16px_60px_var(--rl-primary-950)]">
        <div
          class="timezone-mode-switch flex flex-wrap gap-2 border-b border-primary-700/40 px-5 pt-5 pb-4 sm:px-8 lg:px-10"
          role="group"
          aria-label={t.raw("timezone.conversionMode", "Conversion mode")}
        >
          <button
            type="button"
            class={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${mode() === "regular" ? "border-primary-500 bg-primary-500 text-black" : "border-primary-700 text-neutral-950 hover:border-primary-500"}`}
            aria-pressed={mode() === "regular" ? "true" : "false"}
            onClick={() => setMode("regular")}
          >
            <span class="i-lucide-clock-3 size-4" aria-hidden="true" />{" "}
            {t.raw("timezone.regularMode", "Regular")}
          </button>
          <button
            type="button"
            class={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${mode() === "discord" ? "border-primary-500 bg-primary-500 text-black" : "border-primary-700 text-neutral-950 hover:border-primary-500"}`}
            aria-pressed={mode() === "discord" ? "true" : "false"}
            onClick={() => setMode("discord")}
          >
            <span class="i-mdi-discord size-4" aria-hidden="true" /> Discord
          </button>
        </div>
        <Show
          when={mode() === "regular"}
          fallback={
            <DiscordConverter
              date={props.date}
              from={props.from}
              local={props.local}
              instant={props.instant}
              groups={groups()}
              localLabel={localLabel()}
              setDate={props.setDate}
              setFrom={props.setFrom}
            />
          }
        >
          <div class="p-5 sm:p-8 lg:p-10">
            <div class="relative mb-7 flex flex-wrap items-center gap-3 border-b border-primary-700/40 pb-5">
              <span
                class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/15 text-xl text-primary-500"
                aria-hidden="true"
              >
                ◷
              </span>
              <div>
                <p class="font-bold">{t.raw("timezone.setTime", "Set your time")}</p>
              </div>
              <div class="relative mx-auto w-full sm:max-w-sm md:absolute md:left-1/2 md:-translate-x-1/2">
                <span class="sr-only">
                  {t.raw("timezone.searchTimezones", "Search countries, cities or timezones")}
                </span>
                <SearchToolbar
                  value={search()}
                  suggestion={completion()?.city}
                  onInput={(value) => {
                    setSearch(value);
                    selectSearch(value);
                  }}
                  onAccept={() => {
                    const match = completion();
                    if (match) {
                      selectSearch(`${match.label} (${match.zone})`);
                    }
                  }}
                />
              </div>
            </div>
            <div class="grid gap-5 lg:grid-cols-3">
              <div class="grid content-start gap-3 text-sm font-semibold">
                {t.raw("timezone.dateTime", "Date and time")}:
                <DateTimeField
                  value={props.date}
                  onChange={(value) => {
                    props.setDate(value);
                    props.setCopyStatus("");
                  }}
                />
              </div>
              <label class="grid content-start gap-3 text-sm font-semibold">
                {t.raw("timezone.fromTimezone", "From timezone")}:
                <TimezoneSelect
                  groups={groups()}
                  localLabel={localLabel()}
                  selectedFlag={optionFlag(props.from, sourceFlag())}
                  label={t.raw("timezone.fromTimezone", "From timezone")}
                  class="min-h-14 w-full min-w-0 rounded-xl border border-primary-700/50 bg-default px-4 text-base text-neutral-950 transition-colors hover:border-primary-500 focus-visible:outline-2 focus-visible:outline-primary-500"
                  value={fromValue()}
                  onChange={(e) => {
                    setSourcePlace(
                      e.currentTarget.value.includes("#") ? e.currentTarget.value : undefined,
                    );
                    setSourceFlag(e.currentTarget.selectedOptions[0]?.dataset["countryFlag"]);
                    props.setFrom(
                      e.currentTarget.value === "__local__"
                        ? props.local
                        : e.currentTarget.value.split("#")[0]!,
                    );
                    props.setCopyStatus("");
                  }}
                >
                  <TimezoneOptions
                    groups={groups()}
                    localLabel={localLabel()}
                    selected={fromValue()}
                    selectedFlag={optionFlag(props.from, sourceFlag())}
                  />
                </TimezoneSelect>
              </label>
              <label class="grid content-start gap-3 text-sm font-semibold">
                {t.raw("timezone.toTimezone", "To timezone")}:
                <TimezoneSelect
                  groups={groups()}
                  localLabel={localLabel()}
                  selectedFlag={optionFlag(props.to, selectedFlag())}
                  label={t.raw("timezone.toTimezone", "To timezone")}
                  triggerRef={(element) => {
                    props.destinationRef(element);
                  }}
                  style={{
                    outline: props.convertedCity !== undefined ? "2px solid #ffbf00" : undefined,
                    "outline-offset": "3px",
                  }}
                  class="min-h-14 w-full min-w-0 rounded-xl border border-primary-700/50 bg-default px-4 text-base text-neutral-950 transition-colors hover:border-primary-500 focus-visible:outline-2 focus-visible:outline-primary-500"
                  value={toValue()}
                  onChange={(e) => {
                    setSelectedFlag(e.currentTarget.selectedOptions[0]?.dataset["countryFlag"]);
                    const optionValue = e.currentTarget.value;
                    setSelectedPlace(
                      optionValue.includes("#")
                        ? [
                            ...searchOptions(),
                            ...remotePlaces(),
                            ...(selectedPlace() ? [selectedPlace()!] : []),
                          ].find((item) => item.value === optionValue)
                        : undefined,
                    );
                    props.setTo(
                      optionValue === "__local__" ? props.local : optionValue.split("#")[0]!,
                    );
                    setSearch("");
                    props.setConvertedCity(undefined);
                    props.setCopyStatus("");
                  }}
                >
                  <TimezoneOptions
                    groups={groups()}
                    localLabel={localLabel()}
                    selected={toValue()}
                    selectedFlag={optionFlag(props.to, selectedFlag())}
                  />
                </TimezoneSelect>
                <Show when={props.convertedCity !== undefined}>
                  <span class="text-xs font-semibold text-primary-500" role="status">
                    {t.raw("timezone.selectedGlobe", "Selected from globe")}:{" "}
                    {cities[props.convertedCity!]![0]} · {props.to.replaceAll("_", " ")}
                  </span>
                </Show>
              </label>
            </div>
            {/* A full date makes changes across midnight visible. */}
            <div
              class="mt-8 flex flex-col items-center gap-6 rounded-2xl border border-primary-700 bg-gradient-to-br from-primary-950/60 to-neutral-50 px-5 py-8 text-center text-neutral-950 sm:px-8 sm:py-10"
              aria-live="polite"
            >
              <div>
                <p class="text-xs font-bold tracking-[0.2em] text-primary-500">
                  {t.raw("timezone.convertedTime", "YOUR CONVERTED TIME")}
                </p>
                <Show when={props.instant}>
                  <p class="mt-3 text-sm font-semibold text-primary-500">{convertedDay()}</p>
                </Show>
                <Show
                  when={props.instant}
                  fallback={
                    <p class="mt-3 max-w-3xl text-2xl font-bold">
                      {props.date
                        ? t.raw("timezone.invalidTime", "This local time cannot be converted.")
                        : t.raw("timezone.chooseDate", "Choose a date and time")}
                    </p>
                  }
                >
                  <div class="mt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-widest opacity-65">
                        {t.raw("timezone.dateLabel", "Date")}
                      </p>
                      <p class="mt-1 text-2xl font-bold tabular-nums sm:text-3xl">
                        {convertedParts()[0]}
                      </p>
                    </div>
                    <span class="h-10 w-px bg-primary-700/60" aria-hidden="true" />
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-widest opacity-65">
                        {t.raw("timezone.timeLabel", "Time")}
                      </p>
                      <p class="mt-1 text-2xl font-bold tabular-nums sm:text-3xl">
                        {convertedParts()[1]?.replaceAll("/", ":")}
                      </p>
                    </div>
                  </div>
                  <p class="mt-3 text-xs opacity-65">{props.to.replaceAll("_", " ")}</p>
                </Show>
              </div>
              <div class="flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
                <RLButton
                  color="primary"
                  leadingIcon="i-lucide-copy"
                  class="min-h-11 justify-center rounded-xl px-5 font-semibold"
                  onClick={props.copy}
                  disabled={!props.instant}
                >
                  {t.raw("timezone.copyClipboard", "Copy to clipboard")}
                </RLButton>
                <Show when={props.instant}>
                  {(value) => {
                    // Google Calendar opens a draft; the visitor chooses whether to save it.
                    const stamp = (date: Date) =>
                      date
                        .toISOString()
                        .replace(/[-:]/g, "")
                        .replace(/\.\d{3}Z$/, "Z");
                    const params = new URLSearchParams({
                      action: "TEMPLATE",
                      text: "Scheduled time",
                      dates: `${stamp(value())}/${stamp(new Date(value().getTime() + 3600000))}`,
                    });
                    return (
                      <a
                        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary-700 px-5 text-sm font-semibold hover:border-primary-500 hover:text-primary-500"
                        href={`https://calendar.google.com/calendar/render?${params}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span class="i-lucide-calendar-plus size-4" aria-hidden="true" />
                        {t.raw("timezone.addCalendar", "Add to Google Calendar")}
                      </a>
                    );
                  }}
                </Show>
              </div>
            </div>
            <div class="mt-6 rounded-2xl border border-primary-700/50 bg-default p-5 sm:p-6">
              <p class="text-xs font-bold uppercase tracking-widest text-primary-500">
                {t.raw("timezone.exploreDestination", "Explore your destination")}
              </p>
              <h3 class="mt-2 text-xl font-bold">{destinationLabel()}</h3>
              <div class="mt-3">
                <Show
                  when={destinationIndex() !== undefined || !!selectedFlag()}
                  fallback={
                    <p class="flex flex-wrap items-center gap-3 text-sm">
                      <span class="font-semibold tabular-nums">
                        <AmberClock date={props.now} zone={props.to} />
                      </span>
                      <span class="opacity-65">
                        {t.raw("timezone.weatherUnavailable", "Current weather unavailable")}
                      </span>
                    </p>
                  }
                >
                  <CityInfo
                    index={destinationIndex() ?? 0}
                    countryCode={selectedFlag()}
                    coordinates={selectedPlace()?.coordinates}
                    cityName={
                      selectedPlace()?.zone === props.to
                        ? selectedPlace()!.city
                        : cities[destinationIndex()!]?.[2] === props.to
                          ? undefined
                          : props.to.split("/").at(-1)?.replaceAll("_", " ")
                    }
                    now={props.now}
                    zone={props.to}
                    details
                  />
                </Show>
              </div>
              <p class="mt-4 text-xs opacity-60">
                {t.raw(
                  "timezone.currentConditions",
                  "Current conditions from Open-Meteo. City information and images from Wikipedia and Wikimedia.",
                )}
              </p>
            </div>
            <p class="mt-2 text-sm text-default" role="status">
              {props.copyStatus}
            </p>
          </div>
        </Show>
      </div>
    </section>
  );
}
