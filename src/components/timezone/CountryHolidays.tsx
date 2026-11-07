/** @file Loads and displays national holidays for a selected country and year. */

import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { getLocaleInfo, t } from "@rimelight/i18n";
import { holidayDateKey, selectHolidays, type PublicHoliday } from "./holidays";

type Calendar = { supported: boolean; holidays: PublicHoliday[] };
// Cache resolved calendars only; cancellations cannot poison a later expansion.
const calendars = new Map<string, { data: Calendar; expires: number }>();

export function CountryHolidays(props: {
  country: string | undefined;
  zone: string;
  date: Date | undefined;
}) {
  const [calendar, setCalendar] = createSignal<Calendar>();
  const [loading, setLoading] = createSignal(false);
  const [failed, setFailed] = createSignal(false);
  const [regional, setRegional] = createSignal(false);
  const [fullYear, setFullYear] = createSignal(false);
  const [retry, setRetry] = createSignal(0);
  const day = createMemo(() => (props.date ? holidayDateKey(props.date, props.zone) : ""));
  const year = createMemo(() => day().slice(0, 4));
  const key = createMemo(() =>
    props.country && year() ? `${props.country.toUpperCase()}/${year()}` : "",
  );
  createEffect(
    () => [key(), retry()] as const,
    ([key]) => {
      setFullYear(false);
      setFailed(false);
      setCalendar(undefined);
      if (!key) {
        setLoading(false);
        return;
      }
      const cached = calendars.get(key);
      if (cached && cached.expires > Date.now()) {
        setCalendar(cached.data);
        setLoading(false);
        return;
      }
      setLoading(true);
      const controller = new AbortController();
      void (async () => {
        try {
          const response = await fetch(`/api/holidays/${key}`, { signal: controller.signal });
          if (!response.ok) throw new Error("Holiday data unavailable");
          const data = (await response.json()) as Calendar;
          if (!controller.signal.aborted) {
            calendars.set(key, { data, expires: Date.now() + 3_600_000 });
            if (calendars.size > 64) calendars.delete(calendars.keys().next().value!);
            setCalendar(data);
          }
        } catch {
          if (!controller.signal.aborted) setFailed(true);
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      })();
      return () => controller.abort();
    },
  );
  const available = createMemo(() =>
    selectHolidays(calendar()?.holidays ?? [], day(), regional(), fullYear()),
  );
  const visible = createMemo(() => (fullYear() ? available() : available().slice(0, 6)));
  const selected = createMemo(
    () =>
      calendar()?.holidays.filter((holiday) => holiday.nationalHoliday && holiday.date === day()) ??
      [],
  );
  const regionalCount = createMemo(
    () => calendar()?.holidays.filter((holiday) => !holiday.nationalHoliday).length ?? 0,
  );
  // API dates are calendar dates, not UTC instants in the selected city's zone.
  const formatter = createMemo(
    () =>
      new Intl.DateTimeFormat(getLocaleInfo().tag, {
        timeZone: "UTC",
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
  );
  const name = (holiday: PublicHoliday) =>
    t.raw(
      `timezone.holidayNames.${props.country?.toUpperCase()}.${holiday.name.replace(/[^A-Za-z0-9]/g, "")}`,
      holiday.name,
    );
  return (
    <section
      class="country-holidays rounded-xl border border-primary-700/40 p-4 sm:p-5"
      style={{ order: -1 }}
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h3 class="flex items-center gap-2 text-sm font-bold">
          <span class="i-lucide-calendar-heart size-5 text-primary-500" aria-hidden="true" />
          {t("timezone.holidaysTitle")}
          <span class="text-xs font-normal opacity-55">{year()}</span>
        </h3>
        <Show when={calendar()?.supported && regionalCount() > 0}>
          <button
            type="button"
            class="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary-700/40 px-3 text-xs text-primary-500"
            aria-pressed={regional() ? "true" : "false"}
            onClick={() => setRegional((value) => !value)}
          >
            <span class="i-lucide-map-pinned size-3.5" aria-hidden="true" />
            {regional() ? t("timezone.nationwideOnly") : t("timezone.includeRegional")}
          </button>
        </Show>
      </div>
      <Show
        when={!loading()}
        fallback={
          <p class="py-5 text-center text-sm opacity-60" role="status">
            {t("timezone.loadingHolidays")}
          </p>
        }
      >
        <Show
          when={!failed()}
          fallback={
            <p class="py-4 text-center text-sm opacity-70">
              {t("timezone.holidaysUnavailable")}{" "}
              <button
                type="button"
                class="ml-2 text-primary-500 underline"
                onClick={() => setRetry((value) => value + 1)}
              >
                {t("timezone.retry")}
              </button>
            </p>
          }
        >
          <Show
            when={calendar()?.supported}
            fallback={
              <p class="py-4 text-center text-sm opacity-65">{t("timezone.holidaysUnsupported")}</p>
            }
          >
            <div
              class={`mt-4 flex items-start gap-3 rounded-xl px-4 py-3 ${selected().length ? "bg-primary-500/10" : "bg-primary-500/5"}`}
            >
              <span
                class={`${selected().length ? "i-lucide-party-popper" : "i-lucide-calendar-check"} mt-0.5 size-4 shrink-0 text-primary-500`}
                aria-hidden="true"
              />
              <div class="text-xs leading-relaxed">
                <p class="font-semibold">
                  {selected().length
                    ? t("timezone.holidaySelectedDate")
                    : t("timezone.noHolidaySelectedDate")}
                </p>
                <Show when={selected().length}>
                  <p class="mt-1 opacity-70">{selected().map(name).join(" · ")}</p>
                </Show>
              </div>
            </div>
            <div class="mt-4 flex items-center justify-between gap-3 text-xs">
              <p class="font-semibold opacity-65">
                {fullYear() ? t("timezone.fullYearHolidays") : t("timezone.upcomingHolidays")}
              </p>
              <button
                type="button"
                class="min-h-8 text-primary-500 underline underline-offset-4"
                onClick={() => setFullYear((value) => !value)}
              >
                {fullYear() ? t("timezone.showUpcomingHolidays") : t("timezone.showAllHolidays")}
              </button>
            </div>
            <ul class="mt-2 grid gap-2 sm:grid-cols-2">
              <For each={visible()}>
                {(holiday) => (
                  <li
                    class={`flex items-center gap-3 rounded-xl border p-3 ${holiday.date === day() ? "border-primary-500 bg-primary-500/5" : "border-primary-700/25"}`}
                  >
                    <span
                      class="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-500/10 text-primary-500"
                      aria-hidden="true"
                    >
                      <span
                        class={
                          holiday.nationalHoliday
                            ? "i-lucide-calendar-check size-5"
                            : "i-lucide-map-pinned size-5"
                        }
                      />
                    </span>
                    <div class="min-w-0">
                      <time datetime={holiday.date} class="text-xs font-semibold text-primary-500">
                        {formatter().format(new Date(`${holiday.date}T12:00:00Z`))}
                      </time>
                      <p class="mt-1 text-sm font-semibold leading-snug">{name(holiday)}</p>
                      <p class="mt-1 text-[10px] leading-relaxed opacity-60">
                        {holiday.nationalHoliday
                          ? t("timezone.nationwideHoliday")
                          : `${t("timezone.regionalHoliday")} · ${holiday.subdivisionCodes.join(", ") || t("timezone.selectedRegions")}`}
                      </p>
                    </div>
                  </li>
                )}
              </For>
            </ul>
            <Show when={!visible().length}>
              <p class="py-4 text-center text-xs opacity-65">{t("timezone.noMoreHolidays")}</p>
            </Show>
            <p class="mt-4 text-xs leading-relaxed opacity-60">{t("timezone.holidayCaveat")}</p>
          </Show>
        </Show>
      </Show>
      <a
        href="https://nagerholidays.com"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-3 inline-flex items-center gap-1 text-[10px] text-primary-500"
      >
        Nager.Date
        <span class="i-lucide-arrow-up-right size-3" aria-hidden="true" />
      </a>
    </section>
  );
}
