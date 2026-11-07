import { t } from "@rimelight/i18n";
import { For } from "solid-js";
import { RLMarquee } from "@rimelight/ui";
import { cities, displayCountry, flagCodes, marqueeRows } from "./data";
import { displayCity } from "./city-names";
import { AmberClock } from "./Clock";

// Change playback rate without resetting the animation's position.
function setMarqueeRate(element: HTMLElement, rate: number) {
  for (const animation of element.getAnimations({ subtree: true })) {
    animation.updatePlaybackRate(rate);
  }
}

export function WorldClocks(props: { now: Date | undefined; differences: string[] }) {
  return (
    <section id="world-clocks" class="mb-16 scroll-mt-24" aria-labelledby="clocks-title">
      <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold tracking-widest text-primary-500">
            {t.raw("timezone.aroundWorld", "AROUND THE WORLD")}
          </p>
          <h2 id="clocks-title" class="mt-2 text-2xl font-bold">
            {t.raw("timezone.everywhere", "Right now, everywhere.")}
          </h2>
        </div>
        <p class="flex items-center gap-2.5 text-sm text-neutral-950">
          <span class="relative inline-flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
            <span class="timezone-live-ring absolute inset-0 rounded-full bg-[#ffbf00]" />
            <span class="relative h-2.5 w-2.5 rounded-full bg-[#ffbf00] shadow-[0_0_8px_#ffbf0080]" />
          </span>
          {t.raw("timezone.liveUpdated", "Live, updated every second")}
        </p>
      </div>
      <For each={marqueeRows}>
        {(row, rowIndex) => (
          <div
            onMouseEnter={(event) => setMarqueeRate(event.currentTarget, 0.15)}
            onMouseLeave={(event) =>
              setMarqueeRate(
                event.currentTarget,
                event.currentTarget.contains(document.activeElement) ? 0.15 : 1,
              )
            }
            onFocusIn={(event) => setMarqueeRate(event.currentTarget, 0.15)}
            onFocusOut={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                setMarqueeRate(
                  event.currentTarget,
                  event.currentTarget.matches(":hover") ? 0.15 : 1,
                );
            }}
          >
            <RLMarquee
              direction={rowIndex() ? "right" : "left"}
              pauseOnHover={false}
              speed={70}
              gap="12px"
              class="clock-marquee mb-4 py-2"
            >
              <For each={row}>
                {(city) => (
                  <div class="clock-card group/card relative block min-w-64 overflow-hidden rounded-2xl border border-primary-700 p-5 text-neutral-950 shadow-sm transition-[border-color,box-shadow] hover:border-primary-500 hover:shadow-[0_4px_24px_var(--rl-primary-950)] focus-visible:outline-2 focus-visible:outline-primary-500">
                    <div class="flex items-center gap-3">
                      <span class="flex h-11 w-14 items-center justify-center rounded-xl bg-neutral-50 ring ring-default">
                        <img
                          src={`https://flagcdn.com/w80/${flagCodes[cities.indexOf(city)]}.png`}
                          alt=""
                          loading="lazy"
                          width="40"
                          height="28"
                          class="h-7 w-10 rounded object-cover"
                        />
                      </span>
                      <div class="min-w-0">
                        <p class="text-base font-bold">{displayCity(city[0])}</p>
                        <p class="text-xs opacity-65">{displayCountry(cities.indexOf(city))}</p>
                      </div>
                    </div>
                    <p class="mt-4 whitespace-nowrap text-3xl font-bold tracking-tight tabular-nums">
                      <AmberClock date={props.now} zone={city[2]} />
                    </p>
                    <div class="mt-4 flex items-center justify-between gap-3 border-t border-primary-700/40 pt-3">
                      <span class="inline-flex items-center gap-1.5 rounded-full bg-primary-500/15 px-2.5 py-1 text-xs font-semibold text-primary-500">
                        <span class="i-lucide-clock-3 size-3.5" aria-hidden="true" />
                        {props.differences[cities.indexOf(city)] ??
                          t.raw("timezone.locating", "Locating you…")}
                      </span>
                      <a
                        href={`https://en.wikipedia.org/wiki/${encodeURIComponent((city[0] === "New York" ? "New York City" : city[0]!).replaceAll(" ", "_"))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Read about ${city[0]} on Wikipedia (opens in a new tab)`}
                        class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-primary-500 hover:bg-primary-500/15 focus-visible:outline-2 focus-visible:outline-primary-500"
                      >
                        ↗
                      </a>
                    </div>
                  </div>
                )}
              </For>
            </RLMarquee>
          </div>
        )}
      </For>
    </section>
  );
}
