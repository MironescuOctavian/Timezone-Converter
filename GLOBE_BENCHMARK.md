<!-- Documents globe rendering benchmarks, implementation tradeoffs, and verification limits. -->

# Globe rendering check

## Textured GPU renderer

The preferred renderer now uses native WebGL with an analytic textured sphere.
Country IDs and borders are baked into reusable latitude/longitude textures once
per renderer instance; a tiny palette texture handles themes, hover and filters.
Border mipmaps handle minification. Discrete country IDs use nearest sampling
to avoid blending identifiers. Labels, picking and live visitors remain separate.
There is no new rendering-library dependency.

A warm, short development-browser drag sample measured 150.7 FPS (median 7.1 ms,
p95 10.7 ms) at 1280 × 800 on the preview's RTX 4070 Ti. An initial unstable
sample was throttled; this is not a controlled production FPS comparison.
Browser checks confirmed country selection, 49 labels at 2× zoom, dark-theme
colors, and Canvas fallback after forcing WebGL context loss.

The production hydration blocker documented below has since been resolved by
sharing build plugin instances. The samples above remain development measurements.

Implemented Canvas country rendering, reduced drag-only geometry/raster detail,
and interaction-only pauses for background and marquee animations. Original
country geometry is retained for picking. SVG labels and live markers remain.
An SVG country fallback stays visible until Canvas has drawn successfully.

## Browser sample

1280 × 800 preview, development build, synthetic pointer drag, short samples:

- Previous SVG rotation samples: approximately 17–21 FPS.
- Canvas/drag-detail sample: 71.4 FPS; median interval 14.3 ms, p95 17.9 ms.
- Canvas restored from 780 px during drag to 1560 px after release.
- All 22 sampled background/marquee animations paused and resumed.
- One SVG grid path remained after Canvas initialized; country paths were removed.

These are indicative samples, not controlled hardware or production benchmarks.
They do not establish a guaranteed improvement on another machine.

## Previous production benchmark blocker (resolved)

The earlier production build succeeded, but the local production preview served SSR HTML
without a client hydration entry. Its asset references use development source
URLs. The local clock remains a placeholder and client interactions do not run.
Consequently, those earlier attempts did not produce valid FPS results.
`builder.sharedPlugins: true` now preserves Solid's manifest between client and
Worker builds. Production preview hydration, clocks, and WebGL have been verified.

## Copy feedback

Browser checks confirmed the regular message is inside the converted-time box,
uses 18 px text, and disappears after ten seconds. Discord confirmation also
disappears after ten seconds and has no format-letter suffix. Clipboard writes
were mocked during verification to preserve the user's clipboard.

Validation: 40 tests pass; formatting, lint and types pass. Production build
passes. See `PERFORMANCE.md` for the subsequent production optimization pass.
