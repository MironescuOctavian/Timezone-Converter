/** @file Renders the landing introduction, local time, and interactive grid of international clocks. */

import { dateFormatter } from "./date-format";
import { createMemo, createSignal, For, onSettled, Show } from "solid-js";
import { RLButton } from "@rimelight/ui";
import { getLocaleInfo, t } from "@rimelight/i18n";
import timezoneCountries from "#data/timezone-countries.json";
import { displayCity } from "./city-names";

// All clocks read the same instant; the zone changes only its displayed wall time.
const heroClocks = [
  { city: "New York", country: "US", zone: "America/New_York" },
  { city: "São Paulo", country: "BR", zone: "America/Sao_Paulo" },
  { city: "London", country: "GB", zone: "Europe/London" },
  { city: "Paris", country: "FR", zone: "Europe/Paris" },
  { city: "Bucharest", country: "RO", zone: "Europe/Bucharest" },
  { city: "New Delhi", country: "IN", zone: "Asia/Kolkata" },
  { city: "Beijing", country: "CN", zone: "Asia/Shanghai" },
  { city: "Tokyo", country: "JP", zone: "Asia/Tokyo" },
  { city: "Sydney", country: "AU", zone: "Australia/Sydney" },
];
// Numeric fields stay in Latin digits for hand-angle calculations.
const formatter = (zone: string) =>
  dateFormatter("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

function hands(date: Date | undefined, zone: string) {
  if (!date) return { hour: 0, minute: 0, second: 0, daytime: true };
  const fields = Object.fromEntries(
    formatter(zone)
      .formatToParts(date)
      .map((part) => [part.type, Number(part.value)]),
  );
  const hour = fields["hour"] ?? 0,
    minute = fields["minute"] ?? 0,
    second = fields["second"] ?? 0;
  return {
    // Bounded angles render directly: hydration and rollover never animate full revolutions.
    hour: (hour % 12) * 30 + minute / 2 + second / 120,
    minute: minute * 6 + second / 10,
    second: second * 6,
    daytime: hour >= 6 && hour < 18,
  };
}

// Resolve the timezone once per tick and share the angles between the three hands.
function AnalogClock(props: {
  clock: (typeof heroClocks)[number];
  now: Date | undefined;
  position: number;
  onConvert: (zone: string) => void;
}) {
  const angles = createMemo(() => hands(props.now, props.clock.zone));
  const country = createMemo(() =>
    props.clock.country
      ? (new Intl.DisplayNames([getLocaleInfo().tag], { type: "region" }).of(props.clock.country) ??
        props.clock.country)
      : "",
  );
  return (
    <div
      class={`hero-clock-item${props.clock.country === "RO" ? " hero-clock-featured" : ""}`}
      style={{ "--clock-order": props.position }}
    >
      <div class="hero-clock-meta" aria-hidden="true">
        <span>{String(props.position + 1).padStart(2, "0")}</span>
        <span class={angles().daytime ? "i-lucide-sun size-3" : "i-lucide-moon size-3"} />
      </div>
      <div
        class="hero-clock-face"
        role="img"
        aria-label={`${displayCity(props.clock.city)}: ${props.now ? formatter(props.clock.zone).format(props.now) : "—"}`}
      >
        <span class="hero-clock-markers" aria-hidden="true" />
        <span class="hero-clock-tick hero-clock-tick-top" />
        <span class="hero-clock-tick hero-clock-tick-right" />
        <span class="hero-clock-tick hero-clock-tick-bottom" />
        <span class="hero-clock-tick hero-clock-tick-left" />
        <span
          class="hero-clock-hand hero-clock-hour"
          style={{ transform: `translateX(-50%) rotate(${angles().hour}deg)` }}
        />
        <span
          class="hero-clock-hand hero-clock-minute"
          style={{ transform: `translateX(-50%) rotate(${angles().minute}deg)` }}
        />
        <span
          class="hero-clock-hand hero-clock-second"
          style={{ transform: `translateX(-50%) rotate(${angles().second}deg)` }}
        />
        <span class="hero-clock-center" />
      </div>
      <p class="mt-2 text-xs font-bold tracking-wide text-neutral-950 sm:text-sm">
        {displayCity(props.clock.city)}
      </p>
      <p class="hero-clock-country text-[10px] text-neutral-950/65">
        <Show when={props.clock.country}>
          <img
            src={`https://flagcdn.com/w20/${props.clock.country.toLowerCase()}.png`}
            alt=""
            width="14"
            height="10"
            loading="lazy"
          />
        </Show>
        {country()}
      </p>
      <p class="hero-clock-digital mt-0.5 font-mono text-xs tabular-nums">
        {props.now ? formatter(props.clock.zone).format(props.now) : "—"}
      </p>
      <div class="hero-clock-menu">
        <p class="mb-2 text-xs font-semibold text-primary-500">{displayCity(props.clock.city)}</p>
        <button
          type="button"
          class="hero-clock-convert"
          onClick={() => props.onConvert(props.clock.zone)}
        >
          <span class="i-lucide-arrow-left-right size-4" aria-hidden="true" />
          {t("timezone.heroConvertAction")}
        </button>
        <a
          href={`https://en.wikipedia.org/wiki/${encodeURIComponent((props.clock.country ? new Intl.DisplayNames(["en"], { type: "region" }).of(props.clock.country) : props.clock.city) ?? props.clock.city)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="i-lucide-book-open size-4" aria-hidden="true" />
          {t("timezone.heroLookupAction")}
          <span class="i-lucide-arrow-up-right size-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export function Hero(props: {
  now: Date | undefined;
  localClock: { time: string; zone: string; city: string };
  onConvert: (zone: string) => void;
}) {
  const [localZone, setLocalZone] = createSignal("");
  // Resolve browser-only preferences after hydration, keeping the first server render stable.
  onSettled(() => {
    setLocalZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  });
  const clocks = createMemo(() => {
    const zone = localZone();
    if (!zone) return heroClocks;
    const existing = heroClocks.find((clock) => clock.zone === zone);
    const local = existing ?? {
      city: props.localClock.city || zone.split("/").at(-1)!.replaceAll("_", " "),
      country: ((timezoneCountries as Record<string, string>)[zone] ?? "").toUpperCase(),
      zone,
    };
    return [local, ...heroClocks.filter((clock) => clock.zone !== zone)].slice(0, 9);
  });
  return (
    <div class="hero-layout">
      <div class="hero-copy">
        <span
          class="hero-local inline-flex flex-wrap items-center gap-2 rounded-xl border border-primary-500/40 bg-primary-500/5 px-4 py-3 font-mono text-sm font-bold text-primary-500"
          aria-label={t("timezone.localTime")}
        >
          <svg
            viewBox="0 0 24 24"
            class="mr-1 h-5 w-5 shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 6v6l4 2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="tabular-nums text-neutral-950">{props.localClock.time}</span>
          <span class="text-xs uppercase">
            {props.localClock.zone}
            {props.localClock.city ? ` · ${displayCity(props.localClock.city)}` : ""}
          </span>
        </span>
        <h1 class="hero-heading font-bold tracking-tight">
          {t("timezone.heroTitle")}
          <br />
          <span class="text-primary-500">{t("timezone.heroTail")}</span>
        </h1>
        <p class="hero-description text-base leading-relaxed text-neutral-950/75 sm:text-lg">
          {t("timezone.heroDescription")}
        </p>
        <p class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-500">
          <span aria-hidden="true">✦</span> {t("timezone.noAds")}
        </p>
        <div class="hero-action">
          <RLButton
            href="#converter"
            color="primary"
            size="lg"
            class="hero-cta gap-3 rounded-xl bg-primary-500 font-semibold text-black transition hover:bg-primary-400"
            onClick={(event: MouseEvent) => {
              if (
                event.button !== 0 ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              const section = document.getElementById("converter");
              if (!section) return;
              event.preventDefault();
              section.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "instant"
                  : "smooth",
                block: "start",
              });
            }}
          >
            <span class="i-lucide-clock-3 size-6" aria-hidden="true" />
            {t("timezone.convertTime")}
            <span class="i-lucide-arrow-down size-5" aria-hidden="true" />
          </RLButton>
        </div>
      </div>
      <div class="hero-artwork">
        <p class="hero-artwork-label">
          <span class="size-2.5 rounded-full bg-primary-500" aria-hidden="true" />
          {t("timezone.liveWorldClocks")}
        </p>
        <div class="hero-clocks" aria-label={t("timezone.liveWorldClocks")}>
          <For each={clocks()}>
            {(clock, index) => (
              <AnalogClock
                clock={clock}
                now={props.now}
                position={index()}
                onConvert={props.onConvert}
              />
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
