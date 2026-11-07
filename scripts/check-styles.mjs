import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createGenerator } from "unocss";
import { rimelightUiPreset } from "@rimelight/ui/preset";
import { siteShortcuts } from "../src/styles/shortcuts.ts";

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
  ])
    assert.ok(styles.includes(selector), `Missing production CSS: ${selector}`);
  console.log("PASS: production CSS contains page, clock, slider, sidebar and menu rules");
}
