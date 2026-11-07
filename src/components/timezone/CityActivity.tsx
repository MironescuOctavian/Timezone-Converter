import { createMemo } from "solid-js";
import { t } from "@rimelight/i18n";
import { localActivity } from "./activity";

const icons = {
  work: "i-lucide-briefcase-business",
  free: "i-lucide-coffee",
  sleep: "i-lucide-moon-star",
};

export function CityActivity(props: { date: Date | undefined; zone: string }) {
  const formatter = createMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", { timeZone: props.zone, hour: "2-digit", hourCycle: "h23" }),
  );
  const hour = createMemo(() => (props.date ? Number(formatter().format(props.date)) : undefined));
  const activity = createMemo(() => (hour() !== undefined ? localActivity(hour()!) : undefined));
  const label = () =>
    activity() === "work"
      ? t("timezone.activityWork")
      : activity() === "free"
        ? t("timezone.activityFree")
        : activity() === "sleep"
          ? t("timezone.activitySleep")
          : t("timezone.activityLoading");
  return (
    <span class="city-activity-status" title={label()}>
      <span class={`city-activity city-activity-${activity() ?? "loading"}`} aria-hidden="true">
        <span class={`${activity() ? icons[activity()!] : "i-lucide-clock-3"} size-5`} />
      </span>
      <span class="city-activity-copy">
        <strong>{label()}</strong>
        <small>
          {activity() === "work"
            ? "09–17"
            : activity() === "free"
              ? "07–09 · 17–22"
              : activity() === "sleep"
                ? "22–07"
                : "—"}
        </small>
      </span>
    </span>
  );
}
