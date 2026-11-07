import { DateTimeField } from "./DateTimeField";
import { getLocaleInfo, t } from "@rimelight/i18n";
import { createSignal, For, Show } from "solid-js";
import { discordPreview, discordTimestamp, type DiscordStyle } from "./discord";
import { TimezoneOptions, type TimezoneGroup } from "./TimezoneOptions";
import { TimezoneSelect } from "./TimezoneSelect";
import timezoneCountries from "#data/timezone-countries.json";

// Keep icons beside the format metadata so each row keeps the same visual structure.
const formats: { style: DiscordStyle; icon: string; label: () => string }[] = [
  { style: "t", icon: "i-lucide-clock-3", label: () => t.raw("timezone.shortTime", "Short time") },
  {
    style: "T",
    icon: "i-lucide-timer",
    label: () => t.raw("timezone.longTime", "Time with seconds"),
  },
  { style: "d", icon: "i-lucide-calendar", label: () => t.raw("timezone.shortDate", "Short date") },
  {
    style: "D",
    icon: "i-lucide-calendar-days",
    label: () => t.raw("timezone.longDate", "Long date"),
  },
  {
    style: "f",
    icon: "i-lucide-calendar-clock",
    label: () => t.raw("timezone.dateTimeShort", "Date and time"),
  },
  {
    style: "F",
    icon: "i-lucide-calendar-range",
    label: () => t.raw("timezone.dateTimeFull", "Full date and time"),
  },
  {
    style: "s",
    icon: "i-lucide-hash",
    label: () => t.raw("timezone.numericDateTime", "Numeric date and time"),
  },
  {
    style: "S",
    icon: "i-lucide-alarm-clock",
    label: () => t.raw("timezone.numericDateTimeSeconds", "Numeric date and time with seconds"),
  },
  {
    style: "R",
    icon: "i-lucide-history",
    label: () => t.raw("timezone.relativeTime", "Relative time"),
  },
];

export function DiscordConverter(props: {
  date: string;
  from: string;
  local: string;
  instant: Date | undefined;
  groups: TimezoneGroup[];
  localLabel: string;
  setDate: (value: string) => void;
  setFrom: (value: string) => void;
}) {
  const [status, setStatus] = createSignal("");
  const [sourcePlace, setSourcePlace] = createSignal<string>();
  const fromValue = () =>
    sourcePlace()?.startsWith(`${props.from}#`)
      ? sourcePlace()!
      : props.from === props.local
        ? "__local__"
        : props.from;
  async function copy(style: DiscordStyle) {
    if (!props.instant) return;
    try {
      await navigator.clipboard.writeText(discordTimestamp(props.instant, style));
      setStatus(`${t.raw("timezone.copied", "Copied to clipboard!")} (${style})`);
    } catch {
      setStatus(
        t.raw("timezone.copyFailed", "Could not copy. Please check clipboard permissions."),
      );
    }
  }
  return (
    <div class="p-5 sm:p-8 lg:p-10">
      <div class="mb-6 border-b border-primary-700/40 pb-5">
        <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-500">
          <span class="i-mdi-discord size-5" aria-hidden="true" />
          {t.raw("timezone.discordHeading", "Discord timestamps")}
        </p>
        <p class="mt-2 text-sm leading-relaxed opacity-75">
          {t.raw(
            "timezone.discordDescription",
            "Choose a time, then copy a format. Discord displays it in each reader’s local timezone.",
          )}
        </p>
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <div class="grid gap-3 text-sm font-semibold">
          <span class="inline-flex items-center gap-2">
            <span class="i-lucide-calendar-clock size-4 text-primary-500" aria-hidden="true" />
            {t.raw("timezone.dateTime", "Date and time")}
          </span>
          <DateTimeField
            value={props.date}
            onChange={(value) => {
              props.setDate(value);
              setStatus("");
            }}
          />
        </div>
        <label class="grid gap-3 text-sm font-semibold">
          <span class="inline-flex items-center gap-2">
            <span class="i-lucide-globe-2 size-4 text-primary-500" aria-hidden="true" />
            {t.raw("timezone.fromTimezone", "From timezone")}
          </span>
          <TimezoneSelect
            groups={props.groups}
            localLabel={props.localLabel}
            selectedFlag={(timezoneCountries as Record<string, string>)[props.from]}
            label={t.raw("timezone.fromTimezone", "From timezone")}
            class="min-h-14 w-full min-w-0 rounded-xl border border-primary-700/50 bg-default px-4 text-base text-neutral-950"
            value={fromValue()}
            onChange={(event) => {
              setSourcePlace(
                event.currentTarget.value.includes("#") ? event.currentTarget.value : undefined,
              );
              props.setFrom(
                event.currentTarget.value === "__local__"
                  ? props.local
                  : event.currentTarget.value.split("#")[0]!,
              );
              setStatus("");
            }}
          >
            <TimezoneOptions
              groups={props.groups}
              localLabel={props.localLabel}
              selected={fromValue()}
            />
          </TimezoneSelect>
        </label>
      </div>
      <div class="mt-8">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h3 class="flex items-center gap-2 text-lg font-bold">
            <span class="i-lucide-list-filter size-5 text-primary-500" aria-hidden="true" />
            {t.raw("timezone.discordFormats", "Choose a format")}
          </h3>
          <p class="text-xs opacity-65">
            {t.raw("timezone.discordPreviewNote", "Preview shown in your local timezone")}
          </p>
        </div>
        <Show
          when={props.instant}
          fallback={
            <p class="rounded-xl border border-primary-700/40 p-4 text-sm">
              {props.date
                ? t.raw("timezone.invalidTime", "This local time cannot be converted.")
                : t.raw("timezone.chooseDate", "Choose a date and time")}
            </p>
          }
        >
          {(instant) => (
            <div class="mx-auto grid w-full max-w-3xl gap-1.5">
              <For each={formats}>
                {(format) => (
                  <div class="flex flex-wrap items-center gap-3 rounded-xl border border-primary-700/40 bg-default px-3 py-2">
                    <span
                      class="grid size-9 shrink-0 place-items-center rounded-lg border border-primary-700/30 bg-primary-500/5 text-primary-500"
                      aria-hidden="true"
                    >
                      <span class={`${format.icon} size-4`} />
                    </span>
                    <code class="rounded-lg bg-primary-500/10 px-2.5 py-1.5 text-xs text-neutral-950">
                      {discordTimestamp(instant(), format.style)}
                    </code>
                    <div class="min-w-40 flex-1">
                      <p class="text-xs font-bold uppercase tracking-wider text-primary-500">
                        {format.label()}
                      </p>
                      <p class="mt-0.5 text-sm font-semibold">
                        {discordPreview(instant(), format.style, props.local, getLocaleInfo().tag)}
                      </p>
                    </div>
                    <button
                      type="button"
                      class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 text-sm font-bold text-black hover:bg-primary-400 focus-visible:outline-2 focus-visible:outline-primary-500"
                      onClick={() => copy(format.style)}
                      aria-label={`${t.raw("timezone.copyClipboard", "Copy to clipboard")}: ${format.label()}`}
                    >
                      <span class="i-lucide-copy size-4" aria-hidden="true" />
                      {t.raw("timezone.copy", "Copy")}
                    </button>
                  </div>
                )}
              </For>
            </div>
          )}
        </Show>
        <p class="mt-4 min-h-5 text-sm text-primary-500" role="status" aria-live="polite">
          {status()}
        </p>
      </div>
    </div>
  );
}
