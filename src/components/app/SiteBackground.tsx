/** @file Renders the decorative globe-inspired background and suspends its animation work when hidden. */

import "./site-background.css";
import { For, onSettled } from "solid-js";

// Stable projected widths avoid 3D rings collapsing into overlapping hairlines.
const meridianWidths = [120, 300, 480, 650, 790, 900];
// Staggered, offscreen endpoints keep the light loops from visibly jumping.
const orbitalLights = [
  { path: "M-100 760Q500-130 1540 300", duration: 42, phase: 0 },
  { path: "M1540 610Q720 510-100 610", duration: 57, phase: -24 },
  { path: "M-160 180Q680 1020 1600 660", duration: 68, phase: -42 },
  { path: "M1600 120Q480 420-160 920", duration: 53, phase: -16 },
  { path: "M-160 920Q300 380 1600 160", duration: 75, phase: -58 },
  { path: "M1600 840Q920-80-160 300", duration: 62, phase: -37 },
  { path: "M180-160Q960 480 1180 1160", duration: 84, phase: -29 },
  { path: "M1100 1160Q500 600 340-160", duration: 49, phase: -33 },
];

// CSS animates this single SVG: no scroll listeners, reactive updates, or canvas loop.
export function SiteBackground() {
  function observeVisibility(root: HTMLDivElement) {
    onSettled(() => {
      let animations: Animation[] = [];
      let svgs: SVGSVGElement[] = [];
      const sync = () => {
        if (document.hidden) {
          animations = root!
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState === "running");
          svgs = [...root!.querySelectorAll("svg")].filter((svg) => !svg.animationsPaused());
          animations.forEach((animation) => animation.pause());
          svgs.forEach((svg) => svg.pauseAnimations());
        } else {
          animations.forEach((animation) => animation.play());
          svgs.forEach((svg) => svg.unpauseAnimations());
          animations = [];
          svgs = [];
        }
      };
      document.addEventListener("visibilitychange", sync);
      sync();
      return () => document.removeEventListener("visibilitychange", sync);
    });
  }
  return (
    <div ref={observeVisibility} class="site-graticule" aria-hidden="true">
      <svg viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice" fill="none">
        <defs>
          <pattern id="atlas-crosses" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M22 24h4M24 22v4" stroke="currentColor" stroke-width="0.6" />
          </pattern>
          <radialGradient id="atlas-halo">
            <stop stop-color="currentColor" stop-opacity="0.09" />
            <stop offset="1" stop-color="currentColor" stop-opacity="0" />
          </radialGradient>
          <linearGradient
            id="atlas-light-trail"
            x1="-22"
            y1="0"
            x2="0"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="currentColor" stop-opacity="0" />
            <stop offset="1" stop-color="currentColor" stop-opacity="0.45" />
          </linearGradient>
        </defs>
        <rect width="1440" height="1000" fill="url(#atlas-crosses)" opacity="0.15" />
        <g class="atlas-ambient">
          <ellipse cx="1100" cy="200" rx="650" ry="550" fill="url(#atlas-halo)" />
          <ellipse cx="150" cy="900" rx="500" ry="450" fill="url(#atlas-halo)" />
        </g>
        <g class="atlas-meridians" stroke="currentColor" stroke-width="0.8">
          <For each={meridianWidths}>
            {(width) => <ellipse class="atlas-longitude" cx="720" cy="500" rx={width} ry="1000" />}
          </For>
          <path d="M720-500V1500" />
          <path d="M-200-20Q720 300 1640-20M-200 120Q720 390 1640 120M-200 260Q720 450 1640 260M-200 390Q720 490 1640 390M-200 610Q720 510 1640 610M-200 740Q720 550 1640 740M-200 880Q720 610 1640 880M-200 1020Q720 700 1640 1020" />
        </g>
        <g class="atlas-orbits" stroke="currentColor">
          <ellipse
            cx="720"
            cy="500"
            rx="980"
            ry="330"
            transform="rotate(-28 720 500)"
            stroke-width="0.7"
          />
          <ellipse
            cx="720"
            cy="500"
            rx="990"
            ry="338"
            transform="rotate(-28 720 500)"
            stroke-width="0.5"
            stroke-dasharray="1 8"
          />
          <path
            class="atlas-route"
            d="M-100 760Q500-130 1540 300"
            stroke-width="1.2"
            stroke-dasharray="3 12"
          />
          <path d="M-200 500H1640" stroke-width="1" stroke-dasharray="3 10" opacity="0.5" />
        </g>
        {/* Small lights and gradient tails move independently of the stable grid. */}
        <For each={orbitalLights}>
          {(light) => (
            <g class="atlas-traveller" fill="currentColor">
              <path
                class="atlas-light-tail"
                d="M-22 0H0"
                stroke="url(#atlas-light-trail)"
                stroke-linecap="round"
              />
              <circle r="9" opacity="0.05" />
              <circle r="4.5" opacity="0.1" />
              <circle
                class="atlas-light-core"
                r="1.8"
                style={{ "animation-delay": `${light.phase}s` }}
              />
              <animateMotion
                dur={`${light.duration}s`}
                begin={`${light.phase}s`}
                repeatCount="indefinite"
                rotate="auto"
                path={light.path}
              />
            </g>
          )}
        </For>
        <g class="atlas-waypoints" stroke="currentColor">
          <circle class="atlas-pulse-ring" cx="220" cy="412" r="16" stroke-width="0.7" />
          <circle class="atlas-scan-ring" cx="220" cy="412" r="23" stroke-dasharray="3 13" />
          <circle cx="220" cy="412" r="4" fill="currentColor" stroke="none" />
          <path d="M195 412h-12M245 412h12M220 387v-12M220 437v12" />
          <circle class="atlas-pulse-ring" cx="1210" cy="270" r="20" stroke-width="0.7" />
          <circle
            class="atlas-scan-ring atlas-scan-reverse"
            cx="1210"
            cy="270"
            r="28"
            stroke-dasharray="3 17"
          />
          <circle cx="1210" cy="270" r="5" fill="currentColor" stroke="none" />
          <path d="M1180 270h-10M1240 270h10M1210 240v-10M1210 300v10" />
        </g>
      </svg>
      {/* Viewport-anchored readouts stay visible while the oversized grid rotates. */}
      <div class="atlas-hud">
        <div class="atlas-readout atlas-readout-north">
          <span class="atlas-readout-dot" />
          44° 26′ N<br />
          <small>LATITUDE / NORTH</small>
        </div>
        <div class="atlas-readout atlas-readout-east">
          26° 06′ E<br />
          <small>LONGITUDE / EAST</small>
        </div>
        <div class="atlas-corner-station">
          <div class="atlas-compass">
            <span>N</span>
            <i />
          </div>
          <div class="atlas-readout">
            00° / EQUATOR
            <br />
            <small>GLOBAL TIME NETWORK</small>
          </div>
          <span class="atlas-calibration" />
        </div>
        <div class="atlas-readout atlas-readout-south">
          UTC +00:00
          <br />
          <small>REFERENCE MERIDIAN</small>
        </div>
      </div>
    </div>
  );
}
