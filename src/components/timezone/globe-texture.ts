import { geoRotation, geoEquirectangular, geoPath, type GeoProjection } from "d3-geo";
import { countries } from "./geography";

/**
 * Calculate the bounding box and scaling of the visible globe area on screen.
 * Accommodates both zoom level and aspect ratio variances so that off-square SVG viewports
 * (e.g. mobile vs wide desktop) have complete WebGL canvas coverage without letterboxing.
 */
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

/**
 * Compute the 3x3 rotation matrix for the WebGL vertex/fragment shader.
 *
 * Converts camera-space axes [forward, right, up] into geographic Cartesian vectors:
 * - (0, 0) -> camera-facing center of sphere
 * - (90, 0) -> rightward horizon
 * - (0, 90) -> top horizon
 * Allows the GPU fragment shader to reconstruct 3D surface points and map them to UV coordinates
 * with pure matrix-vector multiplication, bypassing CPU re-projection.
 */
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

/**
 * Pre-render equirectangular textures onto offscreen canvases:
 * 1. `ids`: Encodes each country's unique integer index into the red channel `rgb(index + 1, 0, 0)`.
 *    The fragment shader reads this to look up dynamic colors or highlight the selected country.
 * 2. `borders`: Pre-strokes clean white borders between all country polygons.
 *
 * This texture baking happens once at high resolution (2048x1024), providing crisp 60fps rendering
 * during rotation without running D3 geometry path generation on every frame.
 */
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
