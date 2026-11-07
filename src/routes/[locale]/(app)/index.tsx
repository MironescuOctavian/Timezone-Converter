import { t } from "@rimelight/i18n";
import { createMemo, createSignal, For, onSettled, Show } from "solid-js";
import { RLButton } from "@rimelight/ui";
import { geoCentroid, geoDistance, geoOrthographic, geoPath } from "d3-geo";
import timezoneCountries from "#data/timezone-countries.json";
import {
  cities,
  flagCodes,
  countries,
  countryCities,
  globeGrid,
  labelCountries,
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
import { PresenceLegend, PresenceMarkers } from "#components/timezone/PresenceMarkers";
import { geographicLabels } from "#components/timezone/geographic-labels";
import { PageNav } from "#components/timezone/PageNav";

export default function HomePage() {
  // Signals store the inputs, current time, and feedback shown after copying.
  const [now, setNow] = createSignal<Date | undefined>();
  const [local, setLocal] = createSignal("UTC");
  const [from, setFrom] = createSignal("UTC");
  const [to, setTo] = createSignal("Europe/Bucharest");
  const [date, setDate] = createSignal("");
  const [copyStatus, setCopyStatus] = createSignal("");
  const [hoverCity, setHoverCity] = createSignal(5);
  const [rotation, setRotation] = createSignal(-25);
  const [tilt, setTilt] = createSignal(-15);
  const [zoom, setZoom] = createSignal(1);
  const [pin, setPin] = createSignal<{
    city: number;
    zone?: string;
    cityName?: string;
  }>();
  const [globeSearch, setGlobeSearch] = createSignal("");
  const [, setCountryHovered] = createSignal(false);
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
  let globePanel: HTMLDivElement | undefined;
  const localClock = createMemo(() => {
    const current = now();
    if (!current) return { time: "--:--:--", zone: "LOCAL TIME", city: "" };
    const parts = new Intl.DateTimeFormat("en-GB", {
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
  // Track the pointer outside reactive state while dragging in either direction.
  let dragX: number | undefined;
  let dragY: number | undefined;
  let dragDistance = 0;
  let pressedCountry: number | undefined;
  const projection = createMemo(() =>
    geoOrthographic().translate([260, 260]).scale(245).rotate([rotation(), tilt()]).clipAngle(90),
  );
  const path = createMemo(() => geoPath(projection()));
  const regionLabels = createMemo(() => geographicLabels(projection(), zoom()));
  const countryLabels = createMemo(() => {
    const project = projection();
    const center = project.invert?.([260, 260]);
    if (!center) return [];
    const scale = zoom();
    const minimumArea = scale >= 4 ? 0 : 0.035 * Math.pow((4 - scale) / 3, 3);
    const labels: { x: number; y: number; name: string; width: number; key: string }[] = [];
    for (const { country, centroid, area } of labelCountries) {
      if (area < minimumArea) continue;
      const index = countryCities[String(country.id ?? country.properties.name)];
      if (index === undefined) continue;
      const name = displayCountry(index);
      if (geoDistance(center, centroid) > Math.PI / 2 - 0.08) continue;
      const point = project(centroid);
      const width = Math.max(20, name.length * 5.5) / scale;
      if (
        !point ||
        labels.some(
          (label) =>
            Math.abs(label.x - point[0]) < (label.width + width) / 2 &&
            Math.abs(label.y - point[1]) < 12 / scale,
        )
      )
        continue;
      labels.push({
        x: point[0],
        y: point[1],
        name,
        width,
        key: String(country.id ?? country.properties.name),
      });
    }
    return labels;
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
    setCountryHovered(true);
    const country = countries.find(
      (item) => countryCities[String(item.id ?? item.properties.name)] === index,
    );
    if (country) {
      const [longitude, latitude] = geoCentroid(country);
      setRotation(-longitude);
      setTilt(-latitude);
    } else {
      setRotation(100); // The three US clocks share the same country outline.
      setTilt(-40);
    }
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
      const country = countries.find((item) => {
        const index = countryCities[String(item.id ?? item.properties.name)];
        return index !== undefined && flagCodes[index] === flagCodes[localIndex];
      });
      if (country) {
        const coordinates = labelCountries.find((item) => item.country === country)!.centroid;
        setPin({
          city: localIndex,
          zone,
          cityName: (zone.split("/").at(-1) ?? zone).replaceAll("_", " "),
        });
        setHoverCity(localIndex);
        setRotation(-coordinates[0]);
        setTilt(-coordinates[1]);
      }
    }
    setDate(
      new Date(current.getTime() - current.getTimezoneOffset() * 60_000).toISOString().slice(0, 19),
    );
    setNow(current);
    const timer = setInterval(() => setNow(new Date()), 1000);
    const panel = globePanel;
    const onWheel = (event: WheelEvent) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.deltaY === 0 ||
        (event.target instanceof Element && event.target.closest("select, input"))
      )
        return;
      event.preventDefault();
      setZoom((value) => Math.max(1, Math.min(4, value + (event.deltaY < 0 ? 0.25 : -0.25))));
    };
    panel?.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      clearInterval(timer);
      panel?.removeEventListener("wheel", onWheel);
    };
  });

  // Share both timezone representations of the same instant.
  async function copyConverted() {
    const value = instant();
    if (!value) return;
    const initial = formatClipboardTime(value, from());
    const converted = formatClipboardTime(value, to());
    try {
      await navigator.clipboard.writeText(`${from()}: ${initial}\n${to()}: ${converted}`);
      setCopyStatus(t.raw("timezone.copied", "Copied to clipboard!"));
    } catch {
      setCopyStatus(
        t.raw("timezone.copyFailed", "Could not copy. Please check clipboard permissions."),
      );
    }
  }

  return (
    <main class="timezone-page mx-auto max-w-6xl px-5 pb-20 pt-8 text-neutral-950 sm:px-8 sm:pt-12">
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
            {t.raw("timezone.globeEyebrow", "WORLD EXPLORER")}
          </p>
          <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t.raw("timezone.globeHeading", "Explore time around the world.")}
          </h2>
          <p class="mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
            {t.raw(
              "timezone.globeDescription",
              "Explore the globe, discover local times, and compare places around the world.",
            )}
          </p>
        </div>
        {/* Country selection also works without precision pointing on the globe. */}
        <div
          ref={(element) => {
            globePanel = element;
          }}
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
                {t.raw("timezone.allCountries", "All countries")}
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
                {t.raw("timezone.distinctGaps", "Distinct time gaps")}
              </button>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="grid gap-2 text-left text-sm font-semibold">
                {t.raw("timezone.searchCities", "Search countries or cities")}
                <input
                  type="search"
                  list="globe-search-suggestions"
                  value={globeSearch()}
                  placeholder={t.raw("timezone.searchPlaceholder", "Search for a country or city")}
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
                {t.raw("timezone.exploreCountry", "Explore a country or city")}
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
              {showAllCountries()
                ? t.raw("timezone.exploreEvery", "Explore every mapped country.")
                : t.raw(
                    "timezone.gapExplanation",
                    "One highlighted country per current time difference from you. Dimmed countries share a time gap.",
                  )}
            </p>
            <p class="mt-1 text-left text-xs opacity-65">
              {t.raw(
                "timezone.bandExplanation",
                "The 24 longitude bands show approximate hourly zones; local time boundaries can differ.",
              )}
            </p>
          </div>
          <div class="globe-stage relative min-w-0">
            <svg
              viewBox={`${260 - 260 / zoom()} ${260 - 260 / zoom()} ${520 / zoom()} ${520 / zoom()}`}
              class="globe-canvas mx-auto mt-3 w-full cursor-grab touch-none active:cursor-grabbing"
              role="img"
              aria-label="Interactive globe. Drag to rotate; tap a highlighted country to see its time, or use the country selector."
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.preventDefault();
                dragX = event.clientX;
                dragY = event.clientY;
                dragDistance = 0;
                const index = (event.target as Element)
                  .closest("path")
                  ?.getAttribute("data-city-index");
                pressedCountry = index == null ? undefined : Number(index);
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (dragX === undefined || dragY === undefined) return;
                const distance = event.clientX - dragX;
                const verticalDistance = event.clientY - dragY;
                dragDistance += Math.hypot(distance, verticalDistance);
                dragX = event.clientX;
                dragY = event.clientY;
                setRotation((angle) => angle + distance * 0.6);
                setTilt((angle) => Math.max(-90, Math.min(90, angle - verticalDistance * 0.6)));
              }}
              onPointerUp={(event) => {
                if (dragDistance < 6 && countryIsActive(pressedCountry)) {
                  setHoverCity(pressedCountry!);
                  setCountryHovered(true);
                  setPin({ city: pressedCountry! });
                }
                dragX = undefined;
                dragY = undefined;
                pressedCountry = undefined;
                event.currentTarget.releasePointerCapture(event.pointerId);
              }}
              onPointerCancel={() => {
                dragX = undefined;
                dragY = undefined;
                pressedCountry = undefined;
              }}
            >
              <circle
                cx="260"
                cy="260"
                r="245"
                fill="var(--rl-primary-950)"
                stroke="var(--rl-primary-500)"
              />
              <For each={countries}>
                {(country) => (
                  <path
                    data-city-index={countryCities[String(country.id ?? country.properties.name)]}
                    class="country-shape"
                    d={path()(country) ?? ""}
                    fill={
                      countryIsActive(countryCities[String(country.id ?? country.properties.name)])
                        ? "var(--rl-primary-500)"
                        : "var(--rl-primary-700)"
                    }
                    fill-opacity={
                      countryCities[String(country.id ?? country.properties.name)] === hoverCity()
                        ? "1"
                        : countryIsActive(
                              countryCities[String(country.id ?? country.properties.name)],
                            )
                          ? ".7"
                          : ".1"
                    }
                    stroke={
                      countryCities[String(country.id ?? country.properties.name)] === hoverCity()
                        ? "var(--site-map-selected-outline)"
                        : "var(--rl-neutral-50)"
                    }
                    stroke-width={
                      countryCities[String(country.id ?? country.properties.name)] === hoverCity()
                        ? "3"
                        : countryIsActive(
                              countryCities[String(country.id ?? country.properties.name)],
                            )
                          ? ".7"
                          : "0"
                    }
                    onMouseEnter={() => {
                      const index = countryCities[String(country.id ?? country.properties.name)];
                      if (countryIsActive(index) && dragX === undefined) {
                        setHoverCity(index!);
                        setCountryHovered(true);
                      }
                    }}
                  >
                    <title>
                      {cities[countryCities[String(country.id ?? country.properties.name)]!]?.[1] ??
                        country.properties?.name}
                    </title>
                  </path>
                )}
              </For>
              <path
                d={path()(globeGrid) ?? ""}
                fill="none"
                stroke="var(--rl-primary-500)"
                stroke-opacity=".28"
                stroke-width=".8"
                pointer-events="none"
              />
              <For
                each={
                  zoom() > 1
                    ? countryLabels().filter((label) => countryIsActive(countryCities[label.key]))
                    : []
                }
              >
                {(label) => (
                  <text
                    x={label.x}
                    y={label.y}
                    text-anchor="middle"
                    dominant-baseline="central"
                    fill="var(--site-map-country-label)"
                    stroke="var(--site-map-label-outline)"
                    paint-order="stroke"
                    font-size={String(11 / zoom())}
                    stroke-width={String(3 / zoom())}
                    font-weight="700"
                    pointer-events="none"
                    aria-hidden="true"
                  >
                    {label.name}
                  </text>
                )}
              </For>
              <For each={regionLabels()}>
                {(label) => (
                  <text
                    class="globe-region-label"
                    x={label.x}
                    y={label.y}
                    text-anchor="middle"
                    dominant-baseline="central"
                    fill={
                      label.ocean ? "var(--site-map-ocean-label)" : "var(--site-map-land-label)"
                    }
                    stroke="var(--site-map-label-outline)"
                    paint-order="stroke"
                    stroke-width={String(1.6 / zoom())}
                    font-size={String((label.ocean ? 9 : 11) / zoom())}
                    font-weight={label.ocean ? "500" : "600"}
                    letter-spacing={String((label.ocean ? 1 : 0.9) / zoom())}
                    opacity={label.ocean ? ".9" : "1"}
                    pointer-events="none"
                    aria-hidden="true"
                  >
                    {t.raw(`timezone.mapLabels.${label.name}`, label.name).toUpperCase()}
                  </text>
                )}
              </For>
              <PresenceMarkers projection={projection()} zoom={zoom()} />
            </svg>
          </div>
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
                      : t.raw("timezone.detectingTimezone", "Detecting your timezone…")
                  }
                  onConvert={() => convertSelectedCity(selected().city, undefined, selected().zone)}
                />
              )}
            </Show>
            <CountryCard
              index={hoverCity()}
              now={now()}
              difference={
                differences()[hoverCity()] ??
                t.raw("timezone.detectingTimezone", "Detecting your timezone…")
              }
              onConvert={() => convertSelectedCity(hoverCity())}
            />
          </div>
          {/* Buttons provide the same rotation for keyboard and touch users. */}
          <div class="globe-controls mt-2 grid gap-4">
            <div class="flex flex-wrap items-center justify-center gap-2">
              <RLButton
                color="primary"
                variant="outline"
                size="lg"
                class="min-h-12 min-w-12"
                onClick={() => setRotation((angle) => angle - 20)}
                aria-label={t.raw("timezone.rotateLeft", "Rotate globe left")}
              >
                ←
              </RLButton>
              <button
                type="button"
                class="globe-zoom-button rounded-xl border border-primary-700 text-xl font-bold disabled:opacity-40"
                aria-label={t.raw("timezone.zoomOut", "Zoom out")}
                disabled={zoom() <= 1}
                onClick={() => setZoom((value) => Math.max(1, value - 0.25))}
              >
                −
              </button>
              <span
                class="globe-zoom-value text-center text-xs font-semibold tabular-nums"
                aria-label={`Globe zoom ${Math.round(zoom() * 100)} percent`}
              >
                {Math.round(zoom() * 100)}%
              </span>
              <button
                type="button"
                class="globe-zoom-button rounded-xl border border-primary-700 text-xl font-bold disabled:opacity-40"
                aria-label={t.raw("timezone.zoomIn", "Zoom in")}
                disabled={zoom() >= 4}
                onClick={() => setZoom((value) => Math.min(4, value + 0.25))}
              >
                +
              </button>
              <RLButton
                color="primary"
                variant="outline"
                size="lg"
                class="min-h-12 min-w-12"
                onClick={() => setRotation((angle) => angle + 20)}
                aria-label={t.raw("timezone.rotateRight", "Rotate globe right")}
              >
                →
              </RLButton>
            </div>
          </div>
          <div class="globe-details min-w-0 rounded-2xl border border-primary-700/40 bg-default p-4 sm:p-5">
            {/* A compact legend explains the globe without covering the map. */}
            <div class="globe-guide text-left">
              <p class="text-xs font-bold uppercase tracking-widest text-primary-500">
                {t.raw("timezone.globeGuide", "Explore the globe")}
              </p>
              <div class="mt-3 grid grid-cols-1 gap-3">
                <div class="flex items-start gap-2">
                  <span class="i-lucide-move size-4 shrink-0 text-primary-500" aria-hidden="true" />
                  <span class="text-xs font-medium">
                    {t.raw("timezone.dragRotate", "Drag to rotate")}
                  </span>
                </div>
                <div class="flex items-start gap-2">
                  <span
                    class="i-lucide-zoom-in size-4 shrink-0 text-primary-500"
                    aria-hidden="true"
                  />
                  <span class="text-xs font-medium">{t.raw("timezone.zoomIn", "Zoom in")}</span>
                </div>
                <div class="flex items-start gap-2">
                  <span
                    class="i-lucide-mouse-pointer-2 size-4 shrink-0 text-primary-500"
                    aria-hidden="true"
                  />
                  <span class="text-xs font-medium">
                    {t.raw("timezone.tapExplore", "Tap to explore")}
                  </span>
                </div>
              </div>
            </div>
            <PresenceLegend />
            <p class="mt-3 text-xs opacity-60">
              {t.raw(
                "timezone.representative",
                "One representative city per country. Countries may span several timezones.",
              )}
            </p>
            <a
              class="mt-1 inline-block text-xs text-primary-500 underline"
              href="https://github.com/dr5hn/countries-states-cities-database"
              target="_blank"
              rel="noreferrer"
            >
              {t.raw("timezone.countryData", "Country data · ODbL")}
            </a>
          </div>
        </div>
      </section>
      <WorldClocks now={now()} differences={differences()} />
    </main>
  );
}
