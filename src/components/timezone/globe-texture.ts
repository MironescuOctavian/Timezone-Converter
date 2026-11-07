import { geoRotation, geoEquirectangular, geoPath, type GeoProjection } from "d3-geo";
import { countries } from "./geography";

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
