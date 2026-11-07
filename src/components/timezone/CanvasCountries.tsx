import { createEffect, createSignal, onSettled } from "solid-js";
import { geoPath, type GeoProjection } from "d3-geo";
import { countryCities } from "./data";
import { countries } from "./geography";

// Keep small rings intact; coarse outlines are used only while manipulating the globe.
export function coarseRing(ring: number[][]) {
  if (ring.length < 12) return ring;
  const result = ring.filter((_, index) => index % 3 === 0);
  if (result.at(-1) !== ring.at(-1)) result.push(ring.at(-1)!);
  return result;
}
const coarseCountries = countries.map((country) => ({
  ...country,
  geometry:
    country.geometry.type === "Polygon"
      ? { ...country.geometry, coordinates: country.geometry.coordinates.map(coarseRing) }
      : country.geometry.type === "MultiPolygon"
        ? {
            ...country.geometry,
            coordinates: country.geometry.coordinates.map((polygon) => polygon.map(coarseRing)),
          }
        : country.geometry,
}));

export function CanvasCountries(props: {
  projection: GeoProjection;
  dragging: boolean;
  hover: number;
  active: (index: number | undefined) => boolean;
  onReady: () => void;
}) {
  let canvas: HTMLCanvasElement | undefined;
  let paletteRevision = -1;
  let palette = ["#ffbf00", "#805b00", "#111", "#fff"];
  const [revision, setRevision] = createSignal(0);
  onSettled(() => {
    setRevision((value) => value + 1);
    const observer = new MutationObserver(() => setRevision((value) => value + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style", "class"],
    });
    const scheme = matchMedia("(prefers-color-scheme: light)");
    const refresh = () => setRevision((value) => value + 1);
    scheme.addEventListener("change", refresh);
    return () => {
      observer.disconnect();
      scheme.removeEventListener("change", refresh);
    };
  });
  createEffect(
    () => ({
      revision: revision(),
      projection: props.projection,
      dragging: props.dragging,
      hover: props.hover,
      active: countries.map((country) =>
        props.active(countryCities[String(country.id ?? country.properties.name)]),
      ),
    }),
    (state) => {
      if (!state.revision || !canvas) return;
      const context = canvas.getContext("2d");
      if (!context) return;
      const size = state.dragging ? 780 : 1560;
      if (canvas.width !== size) canvas.width = canvas.height = size;
      context.setTransform(size / 520, 0, 0, size / 520, 0, 0);
      context.clearRect(0, 0, 520, 520);
      if (paletteRevision !== state.revision) {
        // Canvas rejects light-dark() tokens. Let CSS resolve them to concrete
        // colors once per theme change, rather than reading styles each frame.
        const probe = document.createElement("span");
        probe.style.display = "none";
        canvas.appendChild(probe);
        palette = [
          "--rl-primary-500",
          "--rl-primary-700",
          "--rl-neutral-50",
          "--site-map-selected-outline",
        ].map((name) => {
          probe.style.color = `var(${name})`;
          return getComputedStyle(probe).color;
        });
        probe.remove();
        paletteRevision = state.revision;
      }
      const [primary, muted, border, outline] = palette as [string, string, string, string];
      const path = geoPath(state.projection, context);
      const shapes = state.dragging ? coarseCountries : countries;
      for (let index = 0; index < shapes.length; index++) {
        const country = shapes[index]!;
        const selected =
          countryCities[String(country.id ?? country.properties.name)] === state.hover;
        context.beginPath();
        path(country);
        context.fillStyle = state.active[index] ? primary : muted;
        context.globalAlpha = selected ? 1 : state.active[index] ? 0.7 : 0.1;
        context.fill();
        context.globalAlpha = 1;
        context.strokeStyle = selected ? outline : border;
        context.lineWidth = selected ? 3 : 0.7;
        if (selected || state.active[index]) context.stroke();
      }
      props.onReady();
    },
  );
  return (
    <foreignObject x="0" y="0" width="520" height="520" pointer-events="none">
      <canvas
        ref={(element) => {
          canvas = element;
        }}
        width="1560"
        height="1560"
        class="block h-full w-full"
        aria-hidden="true"
      />
    </foreignObject>
  );
}
