import { createEffect, createMemo, createSignal, Show } from "solid-js";
import { t } from "@rimelight/i18n";

export type SearchCity = {
  id: number;
  name: string;
  country: string;
  country_code: string;
  timezone: string;
  latitude: number;
  longitude: number;
  admin1?: string;
};

// Keep autocomplete inside the field instead of rendering a large suggestion menu.
export function SearchToolbar(props: {
  value: string;
  suggestion?: string | undefined;
  onInput: (value: string) => void;
  onAccept: () => void;
  onNext?: ((direction: number) => void) | undefined;
}) {
  return (
    <div class="relative w-full">
      <span
        class="i-lucide-search pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary-500"
        aria-hidden="true"
      />
      <input
        type="search"
        autocomplete="off"
        value={props.value}
        aria-label={t.raw("timezone.searchTimezones", "Search countries, cities or timezones")}
        placeholder={t.raw("timezone.searchTimezones", "Search countries, cities or timezones")}
        class="h-12 w-full rounded-xl border border-primary-700/50 bg-default pl-11 pr-4 text-sm text-neutral-950 focus-visible:outline-2 focus-visible:outline-primary-500"
        onInput={(event) => props.onInput(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (props.onNext && ["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            props.onNext(event.key === "ArrowDown" ? 1 : -1);
            return;
          }
          if (props.suggestion && ["Enter", "Tab", "ArrowRight"].includes(event.key)) {
            event.preventDefault();
            props.onAccept();
          }
        }}
      />
      <Show when={props.suggestion}>
        <button
          type="button"
          title={props.suggestion}
          class="absolute right-2 top-1/2 max-w-[60%] -translate-y-1/2 truncate rounded-lg bg-neutral-50 px-2 py-1 text-xs text-primary-500"
          onClick={() => props.onAccept()}
        >
          → {props.suggestion} · Tab
        </button>
      </Show>
    </div>
  );
}

export function CitySearch(props: { onSelect: (city: SearchCity) => void }) {
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<SearchCity[]>([]);
  const [position, setPosition] = createSignal(0);
  const completion = createMemo(() => results()[position()]);
  createEffect(
    () => query().trim(),
    (name) => {
      setResults([]);
      setPosition(0);
      if (name.length < 2) return;
      const controller = new AbortController();
      const timer = setTimeout(async () => {
        try {
          const params = new URLSearchParams({ name, count: "20", language: "en", format: "json" });
          const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
            signal: controller.signal,
          });
          if (!response.ok) return;
          const data = (await response.json()) as { results?: SearchCity[] };
          if (!controller.signal.aborted)
            setResults((data.results ?? []).filter((city) => city.timezone && city.country_code));
        } catch {
          /* A cancelled or unavailable search leaves the input usable. */
        }
      }, 300);
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    },
  );
  return (
    <SearchToolbar
      value={query()}
      suggestion={
        completion()
          ? `${completion()!.country} · ${completion()!.name}${completion()!.admin1 ? `, ${completion()!.admin1}` : ""}`
          : undefined
      }
      onInput={setQuery}
      onNext={(direction) => {
        if (results().length)
          setPosition((value) => (value + direction + results().length) % results().length);
      }}
      onAccept={() => {
        const city = completion();
        if (city) {
          props.onSelect(city);
          setQuery("");
          setResults([]);
        }
      }}
    />
  );
}
