import { createMemo, createSignal, For, Show } from "solid-js";
import { geoDistance, type GeoProjection } from "d3-geo";
import { t } from "@rimelight/i18n";
import { usePresence } from "./Presence";

export function PresenceMarkers(props: { projection: GeoProjection; zoom: number }) {
  const presence = usePresence();
  const [hovered, setHovered] = createSignal<string>();
  const markers = createMemo(() => {
    const project = props.projection;
    const center = project.invert?.([260, 260]);
    if (!center) return [];
    return presence.cities().flatMap((city) => {
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
            aria-label={`${city.city} · ${city.timezone} · ${city.viewers} online`}
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
              {city().city.slice(0, 25)} · {city().viewers} {t.raw("timezone.online", "online")}
            </text>
            <text x="0" y="-25" text-anchor="middle" fill="white" font-size="10">
              {city().timezone.replaceAll("_", " ")}
            </text>
            <text x="0" y="-11" text-anchor="middle" fill="#bcb5a6" font-size="8">
              {t.raw("timezone.anonymousViewer", "Anonymous · approximate location")}
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
        {presence.connected()
          ? `${presence.total()} ${presence.total() === 1 ? t.raw("timezone.viewerOnline", "viewer online") : t.raw("timezone.viewersOnline", "viewers online")}`
          : t.raw("timezone.presenceConnecting", "Live presence reconnecting…")}
      </p>
      <p class="mt-2 text-xs leading-relaxed opacity-70">
        {t.raw(
          "timezone.presencePrivacy",
          "You appear anonymously. Only your approximate city and timezone are visible. No names or IP addresses are shared.",
        )}
      </p>
      <p class="mt-2 text-xs text-primary-500">
        {presence.hidden()
          ? t.raw("timezone.presenceHidden", "Your dot is hidden.")
          : presence.location()
            ? `${presence.location()!.city} · ${presence.location()!.timezone.replaceAll("_", " ")}`
            : t.raw("timezone.presenceUnknown", "No dot is shown when your city is unavailable.")}
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
        {presence.hidden()
          ? t.raw("timezone.showMyDot", "Show my dot")
          : t.raw("timezone.hideMyDot", "Hide my dot")}
      </button>
    </div>
  );
}
