import { createMemo, For, Show } from "solid-js";
import { getLocaleInfo, t } from "@rimelight/i18n";
import { differenceLabel, differenceMinutes } from "./data";
import { transitions } from "./transitions";

// Read the browser's timezone database rather than maintaining DST dates by hand.
export function TimezoneDetails(props: { zone: string; local: string; now: Date | undefined }) {
  const year = createMemo(() => props.now?.getUTCFullYear());
  const changes = createMemo(() => (year() ? transitions(props.zone, year()!) : []));
  const format = (options: Intl.DateTimeFormatOptions) =>
    props.now
      ? new Intl.DateTimeFormat(getLocaleInfo().tag, { timeZone: props.zone, ...options }).format(
          props.now,
        )
      : "—";
  const zoneName = () =>
    props.now
      ? new Intl.DateTimeFormat(getLocaleInfo().tag, {
          timeZone: props.zone,
          timeZoneName: "long",
        })
          .formatToParts(props.now)
          .find((part) => part.type === "timeZoneName")?.value
      : "—";
  const offset = () =>
    props.now
      ? new Intl.DateTimeFormat("en", {
          timeZone: props.zone,
          timeZoneName: "longOffset",
        })
          .formatToParts(props.now)
          .find((part) => part.type === "timeZoneName")?.value
      : "—";
  const latestChange = createMemo(() =>
    changes()
      .filter((change) => props.now && change.date <= props.now)
      .at(-1),
  );
  const daylight = () =>
    latestChange()?.started ?? (changes().length > 0 && !changes()[0]!.started);
  return (
    <div class="order-first rounded-xl border border-primary-700/40 p-5 text-center text-sm sm:p-6">
      <p class="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-500">
        <span class="i-lucide-globe-2 size-4" aria-hidden="true" />
        {t("timezone.timeZoneLabel")}
      </p>
      <h3 class="mt-3 break-words text-lg font-semibold">{props.zone.replaceAll("_", " ")}</h3>
      <p class="mt-1 text-xs opacity-65">{zoneName()}</p>
      <dl class="mx-auto mt-5 grid max-w-3xl gap-3 sm:grid-cols-3">
        <div class="rounded-xl bg-primary-500/5 px-3 py-4">
          <dt class="flex items-center justify-center gap-2 text-xs opacity-65">
            <span class="i-lucide-clock-3 size-4 text-primary-500" aria-hidden="true" />
            {t("timezone.utcOffset")}
          </dt>
          <dd class="mt-2 font-semibold tabular-nums">{offset()}</dd>
        </div>
        <div class="rounded-xl bg-primary-500/5 px-3 py-4">
          <dt class="flex items-center justify-center gap-2 text-xs opacity-65">
            <span class="i-lucide-arrow-left-right size-4 text-primary-500" aria-hidden="true" />
            {t("timezone.timeDifference")}
          </dt>
          <dd class="mt-2 font-semibold">
            {props.now
              ? differenceLabel(differenceMinutes(props.now, props.zone, props.local))
              : "—"}
          </dd>
        </div>
        <div class="rounded-xl bg-primary-500/5 px-3 py-4">
          <dt class="flex items-center justify-center gap-2 text-xs opacity-65">
            <span class="i-lucide-calendar-days size-4 text-primary-500" aria-hidden="true" />
            {t("timezone.localDate")}
          </dt>
          <dd class="mt-2 font-semibold">
            {format({ weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </dd>
        </div>
      </dl>
      <Show when={changes().length > 0}>
        <div class="mt-5 border-t border-primary-700/30 pt-4">
          <p class="flex items-center justify-center gap-2 text-xs font-semibold text-primary-500">
            <span class="i-lucide-sun size-4" aria-hidden="true" />
            {daylight() ? t("timezone.daylightTime") : t("timezone.standardTime")}
          </p>
          <div class="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-3">
            <For each={changes()}>
              {(change) => (
                <p class="flex flex-wrap items-center justify-center gap-2 text-xs">
                  <span
                    class={
                      change.started
                        ? "i-lucide-calendar-plus size-4 text-primary-500"
                        : "i-lucide-calendar-minus size-4 text-primary-500"
                    }
                    aria-hidden="true"
                  />
                  <span class="opacity-65">
                    {change.started ? t("timezone.dstStarted") : t("timezone.dstEnded")}:
                  </span>
                  <strong>
                    {new Intl.DateTimeFormat(getLocaleInfo().tag, {
                      timeZone: props.zone,
                      dateStyle: "medium",
                    }).format(change.date)}
                  </strong>
                </p>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
