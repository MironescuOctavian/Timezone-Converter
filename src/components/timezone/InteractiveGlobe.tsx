/** @file Coordinates globe projection, labels, country picking, rotation, touch gestures, and zoom controls. */

import { createEffect, createMemo, createSignal, For, onSettled, Show } from "solid-js";
import { RLButton } from "@rimelight/ui";
import { t } from "@rimelight/i18n";
import { geoCentroid, geoContains, geoDistance, geoOrthographic, geoPath } from "d3-geo";
import { countries, globeGrid, labelCountries } from "./geography";
import { countryCities, displayCountry } from "./data";
import { TexturedCountries } from "./TexturedCountries";
import { PresenceMarkers } from "./PresenceMarkers";
import { geographicLabels } from "./geographic-labels";
import { globeGesture } from "./globe-gesture";

/**
 * InteractiveGlobe Component.
 *
 * Renders an interactive 3D orthographic globe featuring:
 * - WebGL shader acceleration with Canvas fallback for country textures and borders.
 * - Inertial touch and pointer drag rotation and tilt.
 * - Continuous pinch-to-zoom (1x - 4x) and mouse-wheel zoom.
 * - Raycasting hit-testing (`hitCountry`) to select countries by tapping/clicking.
 * - Dynamic SVG overlay displaying responsive country and region labels with collision culling.
 * - Real-time aggregated visitor presence markers.
 * - 60fps optimization: automatically pauses heavy background animations during user interaction.
 */
export default function InteractiveGlobe(props: {
  selection: number | undefined;
  hoverCity: number;
  active: (index: number | undefined) => boolean;
  onHover: (index: number) => void;
  onSelect: (index: number) => void;
}) {
  const [rotation, setRotation] = createSignal(-25);
  const [tilt, setTilt] = createSignal(-15);
  const [zoom, setZoom] = createSignal(1);
  let stage: HTMLDivElement | undefined;
  const hoverCity = () => props.hoverCity;
  const setHoverCity = (index: number) => props.onHover(index);
  const countryIsActive = (index: number | undefined) => props.active(index);
  const gesture = globeGesture();
  let pressedCountry: number | undefined;
  const [dragging, setDragging] = createSignal(false);
  const [canvasReady, setCanvasReady] = createSignal(false);
  const [globeWidth, setGlobeWidth] = createSignal(520);
  const [globeAspect, setGlobeAspect] = createSignal(1);
  const labelScale = createMemo(() => Math.max(1, 520 / globeWidth()));

  // Dynamically measure SVG element dimensions using ResizeObserver
  let globeElement!: SVGSVGElement;
  onSettled(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setGlobeWidth(Math.min(entry.contentRect.width, entry.contentRect.height));
        setGlobeAspect(entry.contentRect.width / entry.contentRect.height);
      }
    });
    observer.observe(globeElement);
    return () => observer.disconnect();
  });

  const [adjusting, setAdjusting] = createSignal(false);
  let interactionTimer: ReturnType<typeof setTimeout> | undefined;
  function markInteraction() {
    setAdjusting(true);
    clearTimeout(interactionTimer);
    interactionTimer = setTimeout(() => setAdjusting(false), 180);
  }

  /**
   * Raycast screen coordinates (x, y) to find which country polygon was clicked/tapped:
   * 1. Invert SVG coordinate transformation matrix (CTM) to map viewport pixels into SVG coordinate space.
   * 2. Verify that the click lies inside the sphere radius (hypot <= 245 units).
   * 3. Invert the orthographic projection to obtain geographic [longitude, latitude].
   * 4. Query country GeoJSON geometries with `geoContains` to identify the clicked country.
   */
  function hitCountry(svg: SVGSVGElement, x: number, y: number) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(x, y).matrixTransform(matrix.inverse());
    if (Math.hypot(point.x - 260, point.y - 260) > 245) return;
    const coordinates = projection().invert?.([point.x, point.y]);
    if (!coordinates) return;
    const country = countries.find((shape) => geoContains(shape, coordinates));
    return country ? countryCities[String(country.id ?? country.properties.name)] : undefined;
  }

  // Performance optimization: pause ambient CSS and SVG marquee animations while user drags/rotates
  createEffect(
    () => dragging() || adjusting(),
    (active) => {
      if (!active) return;
      const roots = [...document.querySelectorAll(".site-graticule, .clock-marquee")];
      const animations = roots
        .flatMap((root) => root.getAnimations({ subtree: true }))
        .filter((animation) => animation.playState === "running");
      const svgs = [...document.querySelectorAll<SVGSVGElement>(".site-graticule svg")].filter(
        (svg) => !svg.animationsPaused(),
      );
      animations.forEach((animation) => animation.pause());
      svgs.forEach((svg) => svg.pauseAnimations());
      return () => {
        animations.forEach((animation) => animation.play());
        svgs.forEach((svg) => svg.unpauseAnimations());
      };
    },
  );

  let rotationFrame = 0;
  let pendingLongitude = 0;
  let pendingLatitude = 0;
  let pendingZoom: number | undefined;

  // Flush accumulated rotation delta to Solid signals inside animation frames for fluid 60fps rendering
  function flushRotation() {
    if (rotationFrame) cancelAnimationFrame(rotationFrame);
    rotationFrame = 0;
    const longitude = pendingLongitude;
    const latitude = pendingLatitude;
    pendingLongitude = pendingLatitude = 0;
    if (longitude) setRotation((angle) => angle + longitude);
    if (latitude) setTilt((angle) => Math.max(-90, Math.min(90, angle + latitude)));
    if (pendingZoom !== undefined) setZoom(pendingZoom);
    pendingZoom = undefined;
  }

  // Finalize drag or tap gesture on pointer up/cancel
  function endGesture(event: PointerEvent & { currentTarget: SVGSVGElement }, cancelled = false) {
    flushRotation();
    const tap = gesture.end(event.pointerId, cancelled);
    setDragging(gesture.active);
    if (tap && countryIsActive(pressedCountry)) {
      setHoverCity(pressedCountry!);
      props.onSelect(pressedCountry!);
    }
    if (!gesture.active) pressedCountry = undefined;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  // D3 orthographic projection centered on [260, 260] with 90° clipping (front-facing hemisphere only)
  const projection = createMemo(() =>
    geoOrthographic().translate([260, 260]).scale(245).rotate([rotation(), tilt()]).clipAngle(90),
  );

  // Tenths of a viewBox unit preserve the map outline while shortening DOM updates.
  const path = createMemo(() => geoPath(projection()).digits(1));
  const regionLabels = createMemo(() => geographicLabels(projection(), zoom()));
  const namedCountries = createMemo(() =>
    labelCountries.flatMap((item) => {
      const index = countryCities[String(item.country.id ?? item.country.properties.name)];
      return index === undefined ? [] : [{ ...item, name: displayCountry(index) }];
    }),
  );
  /**
   * Compute dynamic country name labels for display on the globe:
   * - Filters out countries on the backside of the sphere (`geoDistance > PI/2 - 0.08`).
   * - Hides tiny countries when zoomed out based on cubic scaling threshold (`minimumArea`).
   * - Performs bounding-box 2D collision detection to prevent overlapping text labels.
   */
  const countryLabels = createMemo(() => {
    const project = projection();
    const center = project.invert?.([260, 260]);
    if (!center) return [];
    const scale = zoom();
    const textScale = labelScale();
    const minimumArea = scale >= 4 ? 0 : 0.035 * Math.pow((4 - scale) / 3, 3);
    const labels: { x: number; y: number; name: string; width: number; key: string }[] = [];
    for (const { country, centroid, area, name } of namedCountries()) {
      if (area < minimumArea) continue;
      const index = countryCities[String(country.id ?? country.properties.name)];
      if (index === undefined) continue;
      if (geoDistance(center, centroid) > Math.PI / 2 - 0.08) continue;
      const point = project(centroid);
      const width = (Math.max(20, name.length * 5.5) * textScale) / scale;
      if (
        !point ||
        labels.some(
          (label) =>
            Math.abs(label.x - point[0]) < (label.width + width) / 2 &&
            Math.abs(label.y - point[1]) < (12 * textScale) / scale,
        )
      )
        continue;
      labels.push({
        x: point[0],
        y: point[1],
        name,
        width,
        key: String(country.id ?? country.properties.name),
      });
    }
    return labels;
  });

  // When a country is selected from search/cards, smoothly rotate the camera to its centroid
  createEffect(
    () => props.selection,
    (index) => {
      if (index === undefined) return;
      const country = countries.find(
        (item) => countryCities[String(item.id ?? item.properties.name)] === index,
      );
      if (country) {
        const [longitude, latitude] =
          labelCountries.find((item) => item.country === country)?.centroid ?? geoCentroid(country);
        setRotation(-longitude);
        setTilt(-latitude);
      } else {
        setRotation(100);
        setTilt(-40);
      }
    },
  );

  onSettled(() => {
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || event.deltaY === 0) return;
      event.preventDefault();
      markInteraction();
      setZoom((value) => Math.max(1, Math.min(4, value + (event.deltaY < 0 ? 0.25 : -0.25))));
    };
    stage?.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      stage?.removeEventListener("wheel", onWheel);
      clearTimeout(interactionTimer);
      if (rotationFrame) cancelAnimationFrame(rotationFrame);
    };
  });
  return (
    <>
      {" "}
      <div
        ref={(element) => {
          stage = element;
        }}
        class="globe-stage relative min-w-0"
      >
        <svg
          ref={(element) => (globeElement = element)}
          viewBox={`${260 - 260 / zoom()} ${260 - 260 / zoom()} ${520 / zoom()} ${520 / zoom()}`}
          class="globe-canvas mx-auto mt-3 w-full cursor-grab touch-none active:cursor-grabbing"
          role="img"
          aria-label="Interactive globe. Drag to rotate; tap a highlighted country to see its time, or use the country selector."
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            flushRotation();
            const pinching = gesture.start(event.pointerId, event.clientX, event.clientY, zoom());
            pressedCountry = pinching
              ? undefined
              : hitCountry(event.currentTarget, event.clientX, event.clientY);
            setDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!gesture.active) {
              if (event.pointerType === "touch") return;
              const index = hitCountry(event.currentTarget, event.clientX, event.clientY);
              if (countryIsActive(index)) setHoverCity(index!);
              return;
            }
            const movement = gesture.move(event.pointerId, event.clientX, event.clientY);
            if (!movement) return;
            pendingLongitude += movement.dx * 0.6;
            pendingLatitude -= movement.dy * 0.6;
            if ("zoom" in movement) pendingZoom = movement.zoom;
            // Pointer events can outpace refresh rate; project once per frame.
            if (!rotationFrame) rotationFrame = requestAnimationFrame(flushRotation);
          }}
          onPointerUp={(event) => endGesture(event)}
          onPointerCancel={(event) => endGesture(event, true)}
          onLostPointerCapture={(event) => endGesture(event, true)}
        >
          <circle
            cx="260"
            cy="260"
            r="245"
            fill="var(--rl-primary-950)"
            stroke="var(--rl-primary-500)"
          />
          <TexturedCountries
            aspectRatio={globeAspect()}
            projection={projection()}
            zoom={zoom()}
            dragging={dragging() || adjusting()}
            hover={hoverCity()}
            active={countryIsActive}
            onReady={() => setCanvasReady(true)}
          />
          <Show when={!canvasReady()}>
            <For each={countries}>
              {(country) => (
                <path
                  d={path()(country) ?? ""}
                  fill="var(--rl-primary-500)"
                  fill-opacity={
                    countryIsActive(countryCities[String(country.id ?? country.properties.name)])
                      ? ".7"
                      : ".1"
                  }
                  stroke="var(--rl-neutral-50)"
                  stroke-width=".7"
                />
              )}
            </For>
          </Show>
          <path
            d={path()(globeGrid) ?? ""}
            fill="none"
            stroke="var(--rl-primary-500)"
            stroke-opacity=".28"
            stroke-width=".8"
            pointer-events="none"
          />
          <For
            keyed={false}
            each={
              zoom() > 1
                ? countryLabels().filter((label) => countryIsActive(countryCities[label.key]))
                : []
            }
          >
            {(label) => (
              <text
                x={label().x}
                y={label().y}
                text-anchor="middle"
                dominant-baseline="central"
                fill="var(--site-map-country-label)"
                stroke="var(--site-map-label-outline)"
                paint-order="stroke"
                font-size={String((11 * labelScale()) / zoom())}
                stroke-width={String((3 * labelScale()) / zoom())}
                font-weight="700"
                pointer-events="none"
                aria-hidden="true"
              >
                {label().name}
              </text>
            )}
          </For>
          <For keyed={false} each={regionLabels()}>
            {(label) => (
              <text
                class="globe-region-label"
                x={label().x}
                y={label().y}
                text-anchor="middle"
                dominant-baseline="central"
                fill={label().ocean ? "var(--site-map-ocean-label)" : "var(--site-map-land-label)"}
                stroke="var(--site-map-label-outline)"
                paint-order="stroke"
                stroke-width={String((1.6 * labelScale()) / zoom())}
                font-size={String(((label().ocean ? 9 : 11) * labelScale()) / zoom())}
                font-weight={label().ocean ? "500" : "600"}
                letter-spacing={String((label().ocean ? 1 : 0.9) / zoom())}
                opacity={label().ocean ? ".9" : "1"}
                pointer-events="none"
                aria-hidden="true"
              >
                {t.raw(`timezone.mapLabels.${label().name}`, label().name).toUpperCase()}
              </text>
            )}
          </For>
          <PresenceMarkers projection={projection()} zoom={zoom()} />
        </svg>
      </div>
      {/* Buttons provide the same rotation for keyboard and touch users. */}
      <div class="globe-controls mt-2 grid gap-4">
        <div class="flex flex-wrap items-center justify-center gap-2">
          <RLButton
            color="primary"
            variant="outline"
            size="lg"
            class="min-h-12 min-w-12"
            onClick={() => {
              markInteraction();
              setRotation((angle) => angle - 20);
            }}
            aria-label={t("timezone.rotateLeft")}
          >
            ←
          </RLButton>
          <button
            type="button"
            class="globe-zoom-button rounded-xl border border-primary-700 text-xl font-bold disabled:opacity-40"
            aria-label={t("timezone.zoomOut")}
            disabled={zoom() <= 1}
            onClick={() => {
              markInteraction();
              setZoom((value) => Math.max(1, value - 0.25));
            }}
          >
            −
          </button>
          <span
            class="globe-zoom-value text-center text-xs font-semibold tabular-nums"
            aria-label={`Globe zoom ${Math.round(zoom() * 100)} percent`}
          >
            {Math.round(zoom() * 100)}%
          </span>
          <button
            type="button"
            class="globe-zoom-button rounded-xl border border-primary-700 text-xl font-bold disabled:opacity-40"
            aria-label={t("timezone.zoomIn")}
            disabled={zoom() >= 4}
            onClick={() => {
              markInteraction();
              setZoom((value) => Math.min(4, value + 0.25));
            }}
          >
            +
          </button>
          <RLButton
            color="primary"
            variant="outline"
            size="lg"
            class="min-h-12 min-w-12"
            onClick={() => {
              markInteraction();
              setRotation((angle) => angle + 20);
            }}
            aria-label={t("timezone.rotateRight")}
          >
            →
          </RLButton>
        </div>
      </div>
    </>
  );
}
