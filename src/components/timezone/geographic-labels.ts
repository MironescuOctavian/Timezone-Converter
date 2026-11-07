/** @file Positions continent and ocean labels according to globe rotation and zoom. */

import { geoDistance, type GeoProjection } from "d3-geo";

type Region = { name: string; ocean: boolean; anchors: [number, number][] };
// Label anchors are geographic locations, not screen positions. Ocean alternatives
// keep one label visible when rotating across the date line or around Antarctica.
const regions: Region[] = [
  { name: "North America", ocean: false, anchors: [[-105, 45]] },
  { name: "South America", ocean: false, anchors: [[-60, -15]] },
  { name: "Europe", ocean: false, anchors: [[18, 53]] },
  { name: "Africa", ocean: false, anchors: [[20, 5]] },
  { name: "Asia", ocean: false, anchors: [[90, 43]] },
  { name: "Australia", ocean: false, anchors: [[134, -25]] },
  { name: "Antarctica", ocean: false, anchors: [[0, -83]] },
  {
    name: "Pacific Ocean",
    ocean: true,
    anchors: [
      [-145, 0],
      [165, 0],
    ],
  },
  { name: "Atlantic Ocean", ocean: true, anchors: [[-35, 12]] },
  { name: "Indian Ocean", ocean: true, anchors: [[78, -25]] },
  { name: "Arctic Ocean", ocean: true, anchors: [[0, 84]] },
  {
    name: "Southern Ocean",
    ocean: true,
    anchors: [
      [-120, -63],
      [0, -63],
      [120, -63],
    ],
  },
];

export function geographicLabels(project: GeoProjection, zoom: number) {
  const center = project.invert?.([260, 260]);
  if (!center) return [];
  return regions.flatMap((region) => {
    if (!region.ocean && zoom > 1) return [];
    const anchor = [...region.anchors].sort(
      (a, b) => geoDistance(center, a) - geoDistance(center, b),
    )[0]!;
    if (geoDistance(center, anchor) > Math.PI / 2 - 0.15) return [];
    const point = project(anchor);
    if (!point) return [];
    // Do not render offscreen labels at higher zoom levels.
    const half = 260 / zoom;
    if (Math.abs(point[0] - 260) > half - 35 / zoom || Math.abs(point[1] - 260) > half - 12 / zoom)
      return [];
    return [{ name: region.name, ocean: region.ocean, x: point[0], y: point[1] }];
  });
}
