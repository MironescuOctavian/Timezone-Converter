/** @file Coordinates the converter page, hero clocks, country selection, on-demand globe, and clock marquees. */

import { t } from "@rimelight/i18n";
import { createMemo, createSignal, For, lazy, Loading, onSettled, Show } from "solid-js";
import timezoneCountries from "#data/timezone-countries.json";
import {
  cities,
  flagCodes,
  countryCities,
  displayCountry,
  differenceMinutes,
  differenceLabel,
  toInstant,
  formatClipboardTime,
} from "#components/timezone/data";
import "#components/timezone/page.css";
import { Hero } from "#components/timezone/Hero";
import { WorldClocks } from "#components/timezone/WorldClocks";
import { Converter } from "#components/timezone/Converter";
import { CountryCard } from "#components/timezone/CountryCard";
import { PresenceLegend } from "#components/timezone/PresenceMarkers";
import { PageNav } from "#components/timezone/PageNav";
import { dateFormatter } from "#components/timezone/date-format";

import { useGlobeActivation } from "#components/timezone/GlobeActivation";
import { GlobePlaceholder } from "#components/timezone/GlobePlaceholder";
const InteractiveGlobe = lazy(() => import("#components/timezone/InteractiveGlobe"));

export default function HomePage() {
  const activation = useGlobeActivation();
  const [mapSelection, setMapSelection] = createSignal<number>();

  // Signals store the inputs, current time, and feedback shown after copying.
  const [now, setNow] = createSignal<Date | undefined>();
  const [local, setLocal] = createSignal("UTC");
  const [from, setFrom] = createSignal("UTC");
  const [to, setTo] = createSignal("Europe/Bucharest");
  const [date, setDate] = createSignal("");
  const [copyStatus, setCopyStatus] = createSignal("");
  const [hoverCity, setHoverCity] = createSignal(5);
  const [pin, setPin] = createSignal<{
    city: number;
    zone?: string;
    cityName?: string;
  }>();
  const [globeSearch, setGlobeSearch] = createSignal("");
  const [showAllCountries, setShowAllCountries] = createSignal(true);
  const [convertedCity, setConvertedCity] = createSignal<number | undefined>();
  const destinationIndex = createMemo(() => {
    const index = cities.findIndex((city) => city[2] === to());
    if (index >= 0) return index;
    const countryCode = (timezoneCountries as Record<string, string>)[to()];
    const representative = flagCodes.findIndex((code) => code === countryCode);
    return representative >= 0 ? representative : undefined;
  });
  let converterSection: HTMLElement | undefined;
  let destinationSelect: HTMLElement | undefined;
  const localClock = createMemo(() => {
    const current = now();
    if (!current) return { time: "--:--:--", zone: "LOCAL TIME", city: "" };
    const parts = dateFormatter("en-GB", {
      timeZone: local(),
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "short",
    }).formatToParts(current);
    return {
      time: parts
        .filter((part) => part.type !== "timeZoneName")
        .map((part) => part.value)
        .join("")
        .trim(),
      zone: parts.find((part) => part.type === "timeZoneName")?.value ?? local(),
      city: local().split("/").at(-1)?.replaceAll("_", " ") ?? local(),
    };
  });
  const instant = createMemo(() => toInstant(date(), from()));
  const currentMinute = createMemo(() =>
    now() ? Math.floor(now()!.getTime() / 60_000) : undefined,
  );
  const featuredDifferences = createMemo(() => {
    const minute = currentMinute();
    if (minute === undefined) return [];
    const instant = new Date(minute * 60_000);
    return cities
      .slice(0, 26)
      .map((city) => differenceLabel(differenceMinutes(instant, city[2]!, local())));
  });
  const differences = createMemo(() => {
    const result = [...featuredDifferences()];
    const index = hoverCity();
    const minute = currentMinute();
    if (index >= 26 && minute !== undefined)
      result[index] = differenceLabel(
        differenceMinutes(new Date(minute * 60_000), cities[index]![2]!, local()),
      );
    return result;
  });
  const focusedCountries = createMemo(() => {
    const minute = currentMinute();
    const seenOffsets = new Set<number>();
    const indices = new Set<number>();
    if (minute === undefined)
      return new Set(Object.values(countryCities).filter((index) => index < 26));
    // Prefer familiar featured countries, then fill the remaining distinct offsets.
    const mapped = [...new Set(Object.values(countryCities))].sort((a, b) => a - b);
    for (const index of mapped) {
      const offset = differenceMinutes(new Date(minute * 60_000), cities[index]![2]!, local());
      if (offset === 0 || seenOffsets.has(offset)) continue;
      seenOffsets.add(offset);
      indices.add(index);
    }
    return indices;
  });
  const countryIsActive = (index: number | undefined) =>
    index !== undefined &&
    (showAllCountries() || focusedCountries().has(index) || index === hoverCity());

  function convertSelectedCity(index = hoverCity(), source?: string, destination?: string) {
    if (source) setFrom(source);
    setTo(destination ?? cities[index]![2]!);
    setConvertedCity(index);
    setCopyStatus("");
    onSettled(() => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      destinationSelect?.focus({ preventScroll: true });
      converterSection?.scrollIntoView({
        behavior: reducedMotion ? "instant" : "smooth",
        block: "start",
      });
      destinationSelect?.animate(
        [
          { boxShadow: "0 0 0 4px #ffbf00, 0 0 32px #ffbf0080" },
          { boxShadow: "0 0 0 2px #ffbf0040, 0 0 0 #ffbf0000" },
        ],
        { duration: reducedMotion ? 0 : 2800, easing: "ease-out" },
      );
    });
  }

  function selectCity(index: number) {
    setHoverCity(index);
    setMapSelection(index);
    // Mobile has one country card; explicit selection must update that card too.
    if (window.matchMedia("(max-width: 639px)").matches) setPin({ city: index });
  }

  function searchCity(value: string) {
    const query = value.trim().toLocaleLowerCase();
    const index = cities.findIndex((city) =>
      [
        city[0],
        city[1],
        displayCountry(cities.indexOf(city)),
        `${city[1]} · ${city[0]}`,
        `${displayCountry(cities.indexOf(city))} · ${city[0]}`,
      ].some((name) => name?.toLocaleLowerCase() === query),
    );
    if (index < 0) return;
    setShowAllCountries(true);
    selectCity(index);
    setGlobeSearch(`${displayCountry(index)} · ${cities[index]![0]}`);
  }

  // Detect the visitor's timezone only in the browser, then refresh clocks each second.
  onSettled(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const current = new Date();
    setLocal(zone);
    setFrom(zone);
    const exactIndex = cities.findIndex((city) => city[2] === zone);
    const countryCode = (timezoneCountries as Record<string, string>)[zone];
    const localIndex =
      exactIndex >= 0 ? exactIndex : flagCodes.findIndex((code) => code === countryCode);
    if (localIndex >= 0) {
      setPin({
        city: localIndex,
        zone,
        cityName: (zone.split("/").at(-1) ?? zone).replaceAll("_", " "),
      });
      setHoverCity(localIndex);
      setMapSelection(localIndex);
    }
    setDate(
      new Date(current.getTime() - current.getTimezoneOffset() * 60_000).toISOString().slice(0, 19),
    );
    setNow(current);
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

  // Share both timezone representations of the same instant.
  async function copyConverted() {
    const value = instant();
    if (!value) return;
    setCopyStatus("");
    const initial = formatClipboardTime(value, from());
    const converted = formatClipboardTime(value, to());
    try {
      await navigator.clipboard.writeText(`${from()}: ${initial}\n${to()}: ${converted}`);
      setCopyStatus(t("timezone.copied"));
    } catch {
      setCopyStatus(t("timezone.copyFailed"));
    }
  }

  return (
    <main class="timezone-page timezone-home">
      <PageNav />
      {/* Explore the live time in each featured city. */}
      <section id="explore" class="mb-14 grid scroll-mt-24 gap-8 lg:mb-20">
        <Hero
          now={now()}
          localClock={localClock()}
          onConvert={(zone) => {
            const exact = cities.findIndex((city) => city[2] === zone);
            const country = (timezoneCountries as Record<string, string>)[zone];
            const index = exact >= 0 ? exact : flagCodes.findIndex((flag) => flag === country);
            convertSelectedCity(index >= 0 ? index : 0, undefined, zone);
          }}
        />
      </section>
      <Converter
        date={date()}
        from={from()}
        to={to()}
        local={local()}
        convertedCity={convertedCity()}
        instant={instant()}
        now={now()}
        copyStatus={copyStatus()}
        destinationIndex={destinationIndex()}
        setDate={setDate}
        setFrom={setFrom}
        setTo={setTo}
        setConvertedCity={setConvertedCity}
        setCopyStatus={setCopyStatus}
        copy={copyConverted}
        sectionRef={(element) => {
          converterSection = element;
        }}
        destinationRef={(element) => {
          destinationSelect = element;
        }}
      />
      <section class="mb-14 mt-14 scroll-mt-24 lg:mb-20">
        <div class="section-heading">
          <p class="text-xs font-bold tracking-widest text-primary-500">
            {t("timezone.globeEyebrow")}
          </p>
          <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("timezone.globeHeading")}
          </h2>
          <p class="mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
            {t("timezone.globeDescription")}
          </p>
        </div>
        {/* Country selection also works without precision pointing on the globe. */}
        <div
          id="globe"
          class="globe-panel min-w-0 relative scroll-mt-24 rounded-3xl border border-primary-700 bg-neutral-50 p-5 text-center shadow-[0_8px_40px_var(--rl-primary-950)] sm:p-7"
        >
          <div class="globe-selector">
            <div
              class="timezone-mode-switch mb-5 flex flex-wrap gap-2"
              role="group"
              aria-label="Globe detail level"
            >
              <button
                type="button"
                aria-pressed={showAllCountries() ? "true" : "false"}
                class="min-h-10 rounded-full border border-primary-700 px-4 text-sm font-semibold"
                onClick={() => {
                  setShowAllCountries(true);
                }}
                style={{
                  background: showAllCountries() ? "var(--rl-primary-500)" : "transparent",
                  color: showAllCountries() ? "#000" : "inherit",
                }}
              >
                <span class="i-lucide-globe-2 size-4" aria-hidden="true" />
                {t("timezone.allCountries")}
              </button>
              <button
                type="button"
                aria-pressed={showAllCountries() ? "false" : "true"}
                class="min-h-10 rounded-full border border-primary-700 px-4 text-sm font-semibold"
                onClick={() => {
                  setShowAllCountries(false);
                }}
                style={{
                  background: !showAllCountries() ? "var(--rl-primary-500)" : "transparent",
                  color: !showAllCountries() ? "#000" : "inherit",
                }}
              >
                <span class="i-lucide-layers size-4" aria-hidden="true" />
                {t("timezone.distinctGaps")}
              </button>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="grid gap-2 text-left text-sm font-semibold">
                {t("timezone.searchCities")}
                <input
                  type="search"
                  list="globe-search-suggestions"
                  value={globeSearch()}
                  placeholder={t("timezone.searchPlaceholder")}
                  autocomplete="off"
                  class="min-h-12 w-full min-w-0 rounded-xl bg-neutral-50 px-4 text-base text-neutral-950 ring ring-default focus-visible:outline-2 focus-visible:outline-primary-500"
                  onInput={(event) => setGlobeSearch(event.currentTarget.value)}
                  onChange={(event) => searchCity(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      searchCity(event.currentTarget.value);
                    }
                  }}
                />
                <datalist id="globe-search-suggestions">
                  <For each={cities}>
                    {(city) => (
                      <option value={`${displayCountry(cities.indexOf(city))} · ${city[0]}`} />
                    )}
                  </For>
                </datalist>
              </label>
              <label class="grid gap-2 text-left text-sm font-semibold">
                {t("timezone.exploreCountry")}
                <select
                  class="min-h-12 w-full rounded-xl bg-neutral-50 px-4 text-base text-neutral-950 ring ring-default focus-visible:outline-2 focus-visible:outline-primary-500"
                  value={String(hoverCity())}
                  onChange={(event) => selectCity(Number(event.currentTarget.value))}
                >
                  <For
                    each={cities
                      .map((city, index) => ({ city, index }))
                      .filter(({ index }) => countryIsActive(index))}
                  >
                    {(item) => (
                      <option value={String(item.index)}>
                        {displayCountry(item.index)} · {item.city[0]}
                      </option>
                    )}
                  </For>
                </select>
              </label>
            </div>
            <p class="mt-2 text-left text-xs opacity-65">
              {showAllCountries() ? t("timezone.exploreEvery") : t("timezone.gapExplanation")}
            </p>
            <p class="mt-1 text-left text-xs opacity-65">{t("timezone.bandExplanation")}</p>
          </div>
          <Show
            when={activation.enabled()}
            fallback={<GlobePlaceholder onEnable={activation.enable} />}
          >
            <Loading fallback={<GlobePlaceholder loading />}>
              <InteractiveGlobe
                selection={mapSelection()}
                hoverCity={hoverCity()}
                active={countryIsActive}
                onHover={setHoverCity}
                onSelect={(city) => {
                  setHoverCity(city);
                  setPin({ city });
                }}
              />
            </Loading>
          </Show>
          <div class="globe-hover-slot min-w-0 grid gap-3">
            <Show when={pin()}>
              {(selected) => (
                <CountryCard
                  selected
                  index={selected().city}
                  now={now()}
                  zone={selected().zone}
                  cityName={selected().cityName}
                  difference={
                    now()
                      ? differenceLabel(
                          differenceMinutes(
                            now()!,
                            selected().zone ?? cities[selected().city]![2]!,
                            local(),
                          ),
                        )
                      : t("timezone.detectingTimezone")
                  }
                  onConvert={() => convertSelectedCity(selected().city, undefined, selected().zone)}
                />
              )}
            </Show>
            <div class="globe-exploring">
              <CountryCard
                index={hoverCity()}
                now={now()}
                difference={differences()[hoverCity()] ?? t("timezone.detectingTimezone")}
                onConvert={() => convertSelectedCity(hoverCity())}
              />
            </div>
          </div>
          <div class="globe-details min-w-0 rounded-2xl border border-primary-700/40 bg-default p-4 sm:p-5">
            {/* A compact legend explains the globe without covering the map. */}
            <div class="globe-guide text-left">
              <p class="text-xs font-bold uppercase tracking-widest text-primary-500">
                {t("timezone.globeGuide")}
              </p>
              <div class="mt-3 grid grid-cols-1 gap-3">
                <div class="flex items-start gap-2">
                  <span class="i-lucide-move size-4 shrink-0 text-primary-500" aria-hidden="true" />
                  <span class="text-xs font-medium">{t("timezone.dragRotate")}</span>
                </div>
                <div class="flex items-start gap-2">
                  <span
                    class="i-lucide-zoom-in size-4 shrink-0 text-primary-500"
                    aria-hidden="true"
                  />
                  <span class="text-xs font-medium">{t("timezone.zoomIn")}</span>
                </div>
                <div class="flex items-start gap-2">
                  <span
                    class="i-lucide-mouse-pointer-2 size-4 shrink-0 text-primary-500"
                    aria-hidden="true"
                  />
                  <span class="text-xs font-medium">{t("timezone.tapExplore")}</span>
                </div>
              </div>
            </div>
            <Show when={activation.enabled()}>
              <PresenceLegend />
            </Show>
            <p class="mt-3 text-xs opacity-60">{t("timezone.representative")}</p>
            <a
              class="mt-1 inline-block text-xs text-primary-500 underline"
              href="https://github.com/dr5hn/countries-states-cities-database"
              target="_blank"
              rel="noreferrer"
            >
              {t("timezone.countryData")}
            </a>
          </div>
        </div>
      </section>
      <WorldClocks now={now()} differences={differences()} />
    </main>
  );
}
