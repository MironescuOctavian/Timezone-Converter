/** @file Tracks pointer gestures to distinguish taps, rotation drags, and bounded two-finger zoom. */

type Point = { x: number; y: number };

/**
 * Multi-touch and pointer gesture tracker for the 3D interactive globe.
 *
 * Responsibilities:
 * - Single-pointer drag: computes delta movement (`dx`, `dy`) for globe rotation and tilt.
 * - Multi-pointer pinch: calculates Euclidean distance between pointers to compute continuous zoom ratio (1x to 4x).
 * - Distinguishes taps from drags/pinches: returns `true` on pointer release only if total travel was minimal (< 6px)
 *   and no pinch occurred, preventing accidental country selection during navigation gestures.
 */
export function globeGesture() {
  const pointers = new Map<number, Point>();
  let distance = 0;
  let pinchZoom = 1;
  let travel = 0;
  let pinched = false;

  // Euclidean distance between the first two active touch pointers
  const separation = () => {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(b.x - a.x, b.y - a.y) : 0;
  };

  return {
    get active() {
      return pointers.size > 0;
    },
    // Register a new pointer down event
    start(id: number, x: number, y: number, zoom: number) {
      if (!pointers.size) {
        travel = 0;
        pinched = false;
      }
      pointers.set(id, { x, y });
      if (pointers.size > 1) {
        pinched = true;
        distance = separation();
        pinchZoom = zoom;
      }
      return pinched;
    },
    // Handle pointer move: computes drag delta or pinch zoom factor
    move(id: number, x: number, y: number) {
      const previous = pointers.get(id);
      if (!previous) return;
      pointers.set(id, { x, y });
      if (pointers.size > 1) {
        const next = separation();
        // Coincident touches need a usable baseline before computing a ratio.
        if (!distance) distance = next;
        return {
          dx: 0,
          dy: 0,
          zoom: Math.max(1, Math.min(4, pinchZoom * (distance ? next / distance : 1))),
        };
      }
      const dx = x - previous.x,
        dy = y - previous.y;
      travel += Math.hypot(dx, dy);
      return { dx, dy };
    },
    // Deregister pointer on up/cancel; returns true if gesture qualifies as a clean click/tap
    end(id: number, cancelled = false) {
      const tracked = pointers.delete(id);
      // A pinch must never turn into a country tap when the last finger lifts.
      return tracked && !pointers.size && !cancelled && !pinched && travel < 6;
    },
  };
}
