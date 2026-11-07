import { t } from "@rimelight/i18n";
import { cities, countryName, displayCountry, flagCodes } from "./data";
import { displayCity } from "./city-names";
import { AmberClock } from "./Clock";
import { CityInfo } from "./CityInfo";

// The globe uses the same card for the pinned location and the latest hover.
export function CountryCard(props: {
  index: number;
  now: Date | undefined;
  difference: string;
  selected?: boolean;
  zone?: string | undefined;
  cityName?: string | undefined;
  onConvert: () => void;
}) {
  return (
    <div
      class="country-card w-full rounded-2xl border border-primary-500 bg-default p-4 text-left shadow-[0_8px_24px_#0003]"
      aria-label={
        props.selected
          ? t.raw("timezone.selectedCountry", "Selected country")
          : t.raw("timezone.hoveredCountry", "Hovered country")
      }
    >
      <p class="mb-3 text-xs font-bold uppercase tracking-widest text-primary-500">
        {props.selected
          ? t.raw("timezone.selectedCountry", "Selected country")
          : t.raw("timezone.hoveredCountry", "Exploring")}
      </p>
      <div class="flex items-center gap-3">
        <img
          src={`https://flagcdn.com/w80/${flagCodes[props.index]}.png`}
          alt=""
          class="h-7 w-10 rounded object-cover ring ring-default"
        />
        <div class="min-w-0">
          <p
            class="flex items-center justify-center gap-1 font-bold"
            title={displayCountry(props.index)}
          >
            <span class="truncate">{displayCountry(props.index)}</span>
            <a
              class="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-primary-500 hover:bg-primary-500/15"
              href={`https://en.wikipedia.org/wiki/${encodeURIComponent(countryName(props.index).replaceAll(" ", "_"))}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Read about ${countryName(props.index)} on Wikipedia`}
            >
              <span class="i-lucide-arrow-up-right size-4" aria-hidden="true" />
            </a>
          </p>
          <p class="truncate text-xs opacity-70" title={props.cityName ?? cities[props.index]?.[0]}>
            {displayCity(props.cityName ?? cities[props.index]?.[0])}
          </p>
        </div>
      </div>
      <p class="mt-3 text-2xl font-bold tabular-nums">
        <AmberClock date={props.now} zone={props.zone ?? cities[props.index]?.[2]} />
      </p>
      <p class="mt-2 truncate text-sm font-semibold text-primary-500" title={props.difference}>
        {props.difference}
      </p>
      <div class="country-card-weather mt-3">
        <CityInfo index={props.index} cityName={props.cityName} />
      </div>
      <div class="country-card-actions mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          class="rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-black"
          onClick={props.onConvert}
        >
          {t.raw("timezone.convertThis", "Convert to this time")} ↑
        </button>
      </div>
    </div>
  );
}
