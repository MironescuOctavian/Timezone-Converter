/** @file Checks UnoCSS generation, production selectors, and the pinned CSP hash for marquee styles. */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createGenerator } from "unocss";
import { rimelightUiPreset } from "@rimelight/ui/preset";
import { siteShortcuts } from "../src/styles/shortcuts.ts";

// Dependency upgrades must keep client-inserted marquee styles compatible with CSP.
const marqueeSource = readFileSync(
  new URL("./components/marquee/RLMarquee.tsx", import.meta.resolve("@rimelight/ui")),
  "utf8",
);
const marqueeStyles = marqueeSource.match(/const MARQUEE_KEYFRAMES = `([\s\S]*?)`;/)?.[1];
assert.ok(marqueeStyles, "Cannot locate RLMarquee style block");
const styleHash = createHash("sha256").update(marqueeStyles).digest("base64");
assert.ok(
  readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8").includes(
    `'sha256-${styleHash}'`,
  ),
  "RLMarquee styles changed: update the pinned CSP hash",
);

// Run under Node: the test runner's browser resolver selects an optional WASM
// parser from UnoCSS's barrel export that this Windows installation doesn't use.
const uno = await createGenerator({ presets: [rimelightUiPreset()], shortcuts: siteShortcuts });
const tokens = new Set(Object.values(siteShortcuts).flatMap((value) => value.split(" ")));
for (const token of tokens) assert.ok((await uno.parseToken(token))?.length, token);
const { css } = await uno.generate(Object.keys(siteShortcuts).join(" "));
for (const marker of [
  ".globe-stage",
  "min-width: 640px",
  "prefers-reduced-motion: reduce",
  "::-webkit-slider-thumb",
  "::-moz-range-thumb",
  ":focus-visible",
  ":popover-open",
])
  assert.ok(css.includes(marker), `Missing generated state: ${marker}`);
assert.ok(!css.includes("#--unocss--"));
console.log(`PASS: ${tokens.size} UnoCSS utilities and responsive/keyboard/motion states`);

if (process.argv.includes("--build")) {
  const directory = ".cloudflare/output/v0/workers/default/assets/assets";
  const styles = readdirSync(directory)
    .filter((file) => file.endsWith(".css"))
    .map((file) => readFileSync(join(directory, file), "utf8"))
    .join("\n");
  assert.ok(!styles.includes("#--unocss--"), "Unresolved UnoCSS production placeholder");
  for (const selector of [
    ".timezone-page",
    ".hero-clock-face",
    ".city-timeline-track",
    ".section-rail",
    ".site-settings-menu",
    ".site-footer-layout",
    ".site-header-container",
    ".site-header-navigation",
    ".site-header-links",
    ".city-photo:not(:disabled)",
  ])
    assert.ok(styles.includes(selector), `Missing production CSS: ${selector}`);
  console.log("PASS: production CSS contains page, clock, slider, sidebar and menu rules");
}
