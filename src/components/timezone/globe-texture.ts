import { geoRotation, geoEquirectangular, geoPath, type GeoProjection } from "d3-geo";
import { countries } from "./geography";

// Render the visible square directly instead of magnifying a cropped canvas.
export function globeViewport(zoom: number, aspectRatio = 1) {
  const size = 520 / Math.max(1, Math.min(4, zoom));
  const aspect = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1;
  // SVG's xMidYMid meet exposes extra user-space above/below (or beside) the
  // square viewBox in rectangular panels. The texture must cover that too.
  const width = size * Math.max(1, aspect);
  const height = size * Math.max(1, 1 / aspect);
  return {
    x: 260 - width / 2,
    y: 260 - height / 2,
    width,
    height,
    scaleX: width / 520,
    scaleY: height / 520,
  };
}

// Columns map camera-facing, right and up axes back to geographic coordinates.
export function inverseGlobeRotation(rotation: [number, number, number]) {
  const transform = geoRotation(rotation);
  return new Float32Array(
    [
      [0, 0],
      [90, 0],
      [0, 90],
    ].flatMap((point) => {
      const [longitude, latitude] = transform
        .invert(point as [number, number])
        .map((value) => (value * Math.PI) / 180);
      return [
        Math.cos(latitude!) * Math.cos(longitude!),
        Math.cos(latitude!) * Math.sin(longitude!),
        Math.sin(latitude!),
      ];
    }),
  );
}

// No labels are baked in: text stays sharp and follows the active UI language.
export function bakeGlobeTextures(width = 2048) {
  const ids = document.createElement("canvas"),
    borders = document.createElement("canvas");
  ids.width = borders.width = width;
  ids.height = borders.height = width / 2;
  const idContext = ids.getContext("2d")!,
    borderContext = borders.getContext("2d")!;
  const projection = geoEquirectangular()
    // Resolve curved coastlines more finely once, while baking reusable textures.
    .precision(0.1)
    .translate([width / 2, width / 4])
    .scale(width / (2 * Math.PI));
  const idPath = geoPath(projection, idContext),
    borderPath = geoPath(projection, borderContext);
  countries.forEach((country, index) => {
    idContext.beginPath();
    idPath(country);
    idContext.fillStyle = `rgb(${index + 1},0,0)`;
    idContext.fill();
    borderContext.beginPath();
    borderPath(country);
    borderContext.strokeStyle = "white";
    borderContext.lineWidth = 0.7;
    borderContext.stroke();
  });
  return { ids, borders };
}

export function cameraMatrix(projection: GeoProjection) {
  return inverseGlobeRotation(projection.rotate());
}
