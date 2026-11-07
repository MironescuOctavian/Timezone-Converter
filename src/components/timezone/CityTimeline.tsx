import { dateFormatter } from "./date-format";
import { createMemo, For } from "solid-js";
import { getLocaleInfo, t } from "@rimelight/i18n";
import { TIMELINE_MINUTES, timelineBands } from "./timeline";

export function CityTimeline(props: {
  start: number | undefined;
  date: Date | undefined;
  zone: string;
  city: string;
  onSelect: (minute: number) => void;
}) {
  const gradient = createMemo(() => {
    if (props.start === undefined) return "none";
    return `linear-gradient(to right, ${timelineBands(props.start, props.zone)
      .map(
        (band, index) =>
          `var(--timeline-${band.period}) ${(index / 48) * 100}% ${((index + 1) / 48) * 100}%`,
      )
      .join(", ")})`;
  });
  const ticks = createMemo(() => {
    if (props.start === undefined) return [];
    const formatter = dateFormatter(getLocaleInfo().tag, {
      timeZone: props.zone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    return Array.from({ length: 9 }, (_, index) =>
      formatter.format(props.start! + index * 6 * 3_600_000),
    );
  });
  const selected = () =>
    props.start !== undefined && props.date
      ? Math.round((props.date.getTime() - props.start) / 60_000)
      : 0;
  return (
    <div class="city-timeline">
      <div class="city-timeline-track" style={{ "background-image": gradient() }}>
        <input
          type="range"
          min="0"
          max={TIMELINE_MINUTES}
          step="1"
          value={selected()}
          disabled={props.start === undefined || !props.date}
          aria-label={`${props.city} · ${t("timezone.compareTimeSlider")}`}
          aria-valuetext={
            props.date
              ? dateFormatter(getLocaleInfo().tag, {
                  timeZone: props.zone,
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(props.date)
              : ""
          }
          onInput={(event) => props.onSelect(Number(event.currentTarget.value))}
        />
      </div>
      <div class="city-timeline-ticks" aria-hidden="true">
        <For each={ticks()}>{(tick) => <span>{tick}</span>}</For>
      </div>
    </div>
  );
}

export function TimelineLegend() {
  return (
    <div class="timeline-legend">
      <span>
        <i class="timeline-day" />
        {t("timezone.timelineDay")}
      </span>
      <span>
        <i class="timeline-evening" />
        {t("timezone.timelineEvening")}
      </span>
      <span>
        <i class="timeline-night" />
        {t("timezone.timelineNight")}
      </span>
    </div>
  );
}
