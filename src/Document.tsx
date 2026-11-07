/** @file Builds the server-rendered HTML shell, locale and theme attributes, metadata, styles, and hydration setup. */

import type { ParentProps } from "solid-js";
import { HydrationScript, useHead } from "@solidjs/web";
import { createDocumentHead } from "@rimelight/seo/head";
import { config as seoConfig } from "virtual:rimelight-seo";
import { getLocaleInfo } from "@rimelight/i18n";
import { getDocumentTheme } from "@rimelight/ui/theme";
import "virtual:uno.css";

/**
 * Root HTML Document shell for Server-Side Rendering (SSR).
 *
 * Configures:
 * - HTML language tag and reading direction (LTR/RTL) from the active locale.
 * - Color theme attribute (`data-theme`) from saved user preference or system default.
 * - Solid HydrationScript for seamless client-side hydration.
 * - Preconnect and async script for Cloudflare Turnstile bot protection.
 * - UnoCSS utility classes stylesheet injection.
 */
export default function Document(props: ParentProps) {
  // Inject reactive meta tags, OpenGraph data, and titles for SEO
  useHead(createDocumentHead({}, seoConfig));

  return (
    <html lang={getLocaleInfo().tag} dir={getLocaleInfo().dir} data-theme={getDocumentTheme()}>
      <head>
        {/* Solid.js hydration script required for server-rendered HTML hydration */}
        <HydrationScript />
        {/* Preconnect and script for Cloudflare Turnstile challenge verification */}
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
      </head>
      <body>{props.children}</body>
    </html>
  );
}
