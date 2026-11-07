/** @file Displays aggregated regional activity markers and the map's privacy and sharing controls. */

import { createMemo, createSignal, For, Show } from "solid-js";
import { geoDistance, type GeoProjection } from "d3-geo";
import { t } from "@rimelight/i18n";
import { usePresence } from "./Presence";
import { REGIONS, MIN_REGION_VIEWERS } from "#presence/regions";
const regionLabel = (key: keyof typeof REGIONS) => t(`timezone.${REGIONS[key].label}`);
const countRange = (count: number) => `${count}–${count + MIN_REGION_VIEWERS - 1}`;

export function PresenceMarkers(props: { projection: GeoProjection; zoom: number }) {
  const presence = usePresence();
  const [hovered, setHovered] = createSignal<string>();
  const markers = createMemo(() => {
    const project = props.projection;
    const center = project.invert?.([260, 260]);
    if (!center) return [];
    return presence.regions().flatMap((city) => {
      const coordinates: [number, number] = [city.longitude, city.latitude];
      if (geoDistance(center, coordinates) >= Math.PI / 2 - 0.03) return [];
      const point = project(coordinates);
      return point ? [{ ...city, x: point[0], y: point[1] }] : [];
    });
  });
  const active = createMemo(() => markers().find((city) => city.key === hovered()));
  return (
    <g class="presence-markers">
      <For each={markers()}>
        {(city) => (
          <g
            transform={`translate(${city.x},${city.y}) scale(${1 / props.zoom})`}
            tabindex="0"
            role="img"
            aria-label={`${regionLabel(city.key)} · ${countRange(city.viewers)} ${t("timezone.online")}`}
            onPointerEnter={() => setHovered(city.key)}
            onPointerLeave={() => setHovered(undefined)}
            onFocus={() => setHovered(city.key)}
            onBlur={() => setHovered(undefined)}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <circle r="10" fill="transparent" />
            <circle
              class="presence-dot-halo"
              r="8"
              fill="#ffbf00"
              opacity="0.2"
              pointer-events="none"
            />
            <circle
              r="3.5"
              fill="#fff4cc"
              stroke="#805b00"
              stroke-width="1.5"
              pointer-events="none"
            />
          </g>
        )}
      </For>
      <Show when={active()}>
        {(city) => (
          <g
            transform={`translate(${Math.min(260 + 240 / props.zoom - 95 / props.zoom, Math.max(260 - 240 / props.zoom + 95 / props.zoom, city().x))},${Math.max(260 - 245 / props.zoom + 62 / props.zoom, city().y - 15 / props.zoom)}) scale(${1 / props.zoom})`}
            pointer-events="none"
            aria-hidden="true"
          >
            <rect x="-95" y="-60" width="190" height="58" rx="9" fill="#17120a" stroke="#ffbf00" />
            <text
              x="0"
              y="-41"
              text-anchor="middle"
              fill="#ffbf00"
              font-size="11"
              font-weight="700"
            >
              {regionLabel(city().key)}
            </text>
            <text x="0" y="-25" text-anchor="middle" fill="white" font-size="10">
              {countRange(city().viewers)} {t("timezone.viewersOnline")}
            </text>
            <text x="0" y="-11" text-anchor="middle" fill="#bcb5a6" font-size="8">
              {t("timezone.anonymousViewer")}
            </text>
          </g>
        )}
      </Show>
    </g>
  );
}

export function PresenceLegend() {
  const presence = usePresence();
  return (
    <div class="mt-4 rounded-xl border border-primary-700/40 bg-primary-500/5 p-4 text-center">
      <p class="flex items-center justify-center gap-2 text-sm font-semibold">
        <span class="i-lucide-users size-4 text-primary-500" aria-hidden="true" />
        {presence.connected() && presence.ready()
          ? `${countRange(presence.total())} ${t("timezone.viewersOnline")}`
          : t("timezone.presenceConnecting")}
      </p>
      <p class="mt-2 text-xs leading-relaxed opacity-70">{t("timezone.presencePrivacy")}</p>
      <p class="mt-2 text-xs text-primary-500">
        {presence.hidden()
          ? t("timezone.presenceHidden")
          : presence.sharing()
            ? t("timezone.presenceSharing")
            : t("timezone.presenceUnknown")}
      </p>
      <button
        type="button"
        class="mt-3 inline-flex min-h-9 items-center gap-2 rounded-full border border-primary-700 px-3 text-xs font-semibold text-primary-500"
        aria-pressed={presence.hidden() ? "true" : "false"}
        onClick={() => presence.toggle()}
      >
        <span
          class={presence.hidden() ? "i-lucide-eye size-3.5" : "i-lucide-eye-off size-3.5"}
          aria-hidden="true"
        />
        {presence.hidden() ? t("timezone.showMyDot") : t("timezone.hideMyDot")}
      </button>
    </div>
  );
}
