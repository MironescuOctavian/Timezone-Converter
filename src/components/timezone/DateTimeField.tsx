/** @file Provides a calendar and time editor that validates draft fields before committing a value. */

import { dateFormatter } from "./date-format";
import { createMemo, createSignal, For, onSettled, Show } from "solid-js";
import { getLocaleInfo, t } from "@rimelight/i18n";

// Draft fields are committed together, so typing an incomplete hour never clears the date.
export function DateTimeField(props: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = createSignal(false);
  const [day, setDay] = createSignal("");
  const [hour, setHour] = createSignal("");
  const [minute, setMinute] = createSignal("");
  const [second, setSecond] = createSignal("");
  const [month, setMonth] = createSignal(0);
  const [year, setYear] = createSignal(2026);
  let root: HTMLDivElement | undefined;
  let trigger: HTMLButtonElement | undefined;
  const pad = (value: number) => String(value).padStart(2, "0");
  function show() {
    const value =
      props.value ||
      new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19);
    setDay(value.slice(0, 10));
    setYear(Number(value.slice(0, 4)));
    setMonth(Number(value.slice(5, 7)) - 1);
    setHour(value.slice(11, 13));
    setMinute(value.slice(14, 16));
    setSecond(value.slice(17, 19) || "00");
    setOpen(true);
  }
  const valid = createMemo(
    () =>
      !!day() &&
      [hour(), minute(), second()].every((value) => /^\d{1,2}$/.test(value)) &&
      Number(hour()) < 24 &&
      Number(minute()) < 60 &&
      Number(second()) < 60,
  );
  function close() {
    setOpen(false);
    trigger?.focus();
  }
  function apply() {
    if (!valid()) return;
    props.onChange(
      `${day()}T${pad(Number(hour()))}:${pad(Number(minute()))}:${pad(Number(second()))}`,
    );
    close();
  }
  function moveMonth(direction: number) {
    const next = new Date(Date.UTC(year(), month() + direction, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth());
  }
  const calendar = createMemo(() => {
    const offset = (new Date(Date.UTC(year(), month(), 1)).getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(year(), month() + 1, 0)).getUTCDate();
    return Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) =>
      index < offset || index >= offset + days ? 0 : index - offset + 1,
    );
  });
  const weekdays = createMemo(() =>
    Array.from({ length: 7 }, (_, index) =>
      dateFormatter(getLocaleInfo().tag, { weekday: "short", timeZone: "UTC" }).format(
        new Date(Date.UTC(2024, 0, 1 + index)),
      ),
    ),
  );
  onSettled(() => {
    const outside = (event: PointerEvent) => {
      if (!root?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  });
  return (
    <div
      ref={(element) => {
        root = element;
      }}
      class="relative min-w-0"
    >
      <button
        type="button"
        ref={(element) => {
          trigger = element;
        }}
        class="relative flex h-14 w-full items-center justify-center rounded-xl border border-primary-700/50 bg-default px-10 text-center text-base font-semibold text-neutral-950 hover:border-primary-500 focus-visible:outline-2 focus-visible:outline-primary-500"
        aria-haspopup="dialog"
        aria-expanded={open() ? "true" : "false"}
        onClick={() => (open() ? close() : show())}
      >
        <span class="truncate">
          {props.value
            ? `${props.value.slice(8, 10)}/${props.value.slice(5, 7)}/${props.value.slice(0, 4)} · ${props.value.slice(11, 19)}`
            : t("timezone.chooseDate")}
        </span>
        <span
          class="i-lucide-calendar-days absolute right-4 size-4 text-primary-500"
          aria-hidden="true"
        />
      </button>
      <Show when={open()}>
        <div
          role="dialog"
          aria-label={t("timezone.dateTime")}
          class="absolute left-0 top-full z-50 mt-2 w-[min(21rem,80vw)] rounded-2xl border border-primary-700 bg-neutral-50 p-4 text-neutral-950 shadow-[0_16px_50px_#0006]"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
            }
            if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
              event.preventDefault();
              apply();
            }
          }}
        >
          <div class="mb-4 flex items-center justify-between gap-2">
            <button
              type="button"
              class="grid size-8 place-items-center rounded-lg border border-primary-700/50 text-primary-500 hover:bg-primary-500/10"
              aria-label={t("timezone.previousMonth")}
              onClick={() => moveMonth(-1)}
            >
              ‹
            </button>
            <span class="font-bold">
              {dateFormatter(getLocaleInfo().tag, {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(new Date(Date.UTC(year(), month(), 1)))}
            </span>
            <button
              type="button"
              class="grid size-8 place-items-center rounded-lg border border-primary-700/50 text-primary-500 hover:bg-primary-500/10"
              aria-label={t("timezone.nextMonth")}
              onClick={() => moveMonth(1)}
            >
              ›
            </button>
          </div>
          <div class="grid grid-cols-7 gap-1 text-center">
            <For each={weekdays()}>
              {(name) => <span class="py-1 text-[10px] font-semibold opacity-60">{name}</span>}
            </For>
            <For each={calendar()}>
              {(date) =>
                date ? (
                  <button
                    type="button"
                    class={`h-8 rounded-lg text-sm transition-colors ${day() === `${year()}-${pad(month() + 1)}-${pad(date)}` ? "bg-primary-500 font-bold text-black" : "hover:bg-primary-500/15"}`}
                    aria-pressed={
                      day() === `${year()}-${pad(month() + 1)}-${pad(date)}` ? "true" : "false"
                    }
                    onClick={() => setDay(`${year()}-${pad(month() + 1)}-${pad(date)}`)}
                  >
                    {date}
                  </button>
                ) : (
                  <span />
                )
              }
            </For>
          </div>
          <div class="mt-4 grid grid-cols-3 gap-2 border-t border-primary-700/40 pt-4">
            <label class="grid gap-1 text-center text-xs">
              <span>{t("timezone.hours")}</span>
              <input
                class="h-11 w-full rounded-lg border border-primary-700/50 bg-default text-center text-lg font-semibold tabular-nums focus:outline-2 focus:outline-white"
                type="text"
                inputmode="numeric"
                maxlength="2"
                value={hour()}
                onInput={(event) => setHour(event.currentTarget.value.replace(/\D/g, ""))}
              />
            </label>
            <label class="grid gap-1 text-center text-xs">
              <span>{t("timezone.minutes")}</span>
              <input
                class="h-11 w-full rounded-lg border border-primary-700/50 bg-default text-center text-lg font-semibold tabular-nums focus:outline-2 focus:outline-white"
                type="text"
                inputmode="numeric"
                maxlength="2"
                value={minute()}
                onInput={(event) => setMinute(event.currentTarget.value.replace(/\D/g, ""))}
              />
            </label>
            <label class="grid gap-1 text-center text-xs">
              <span>{t("timezone.seconds")}</span>
              <input
                class="h-11 w-full rounded-lg border border-primary-700/50 bg-default text-center text-lg font-semibold tabular-nums focus:outline-2 focus:outline-white"
                type="text"
                inputmode="numeric"
                maxlength="2"
                value={second()}
                onInput={(event) => setSecond(event.currentTarget.value.replace(/\D/g, ""))}
              />
            </label>
          </div>
          <button
            type="button"
            disabled={!valid()}
            class="mt-4 min-h-10 w-full rounded-lg bg-primary-500 px-4 text-sm font-bold text-black disabled:opacity-40"
            onClick={apply}
          >
            {t("timezone.applyDateTime")}
          </button>
        </div>
      </Show>
    </div>
  );
}
