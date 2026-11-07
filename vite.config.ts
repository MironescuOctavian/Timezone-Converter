import { defineConfig } from "vite-plus";
import { cloudflare } from "@cloudflare/vite-plugin";
import solid from "@solidjs/vite-plugin";
import { fileRoutes } from "filesystem-routing/vite";
import { seo } from "@rimelight/seo/plugin";
import { security } from "@rimelight/security/plugin";
import { i18n } from "@rimelight/i18n/plugin";
import { ui } from "@rimelight/ui/plugin";
import { siteShortcuts } from "./src/styles/shortcuts";
import type { VitePluginConfig } from "unocss/vite";

const unoBuildMode = { mode: "per-module" } satisfies VitePluginConfig;

export default defineConfig({
  // Development modules change independently of HTML; don't reuse stale module
  // responses across reloads after Vite re-optimizes dependencies.
  server: { headers: { "Cache-Control": "no-store" } },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  staged: {
    "{package.json,pnpm-workspace.yaml,pnpm-lock.yaml}": () => "pnpm audit",
    "*": "vp check --fix",
  },
  plugins: [
    cloudflare(),

    solid({
      exclude: ["src/fetch.ts"],
      start: true,
      ssr: true,
      serverFunctions: true,
    }),

    fileRoutes({ types: ".cloudflare/types/file-routes.d.ts" }),

    seo({
      id: "timezone-converter",
      url: "https://octavianmironescu.com",
      name: "Timezone Converter",
      description: "Compare world clocks, convert timezones, and create Discord timestamps.",
      author: "Mironescu Octavian",
      branding: {
        logo: { alt: "Timezone Converter" },
        colors: { themeColor: "#ffffff", backgroundColor: "#ffffff" },
      },
      titleTemplate: "%s | Timezone Converter",
    }),

    security({
      domain: "octavianmironescu.com",
      connectSrc: [
        "https://geocoding-api.open-meteo.com",
        "https://api.open-meteo.com",
        "https://en.wikipedia.org",
      ],
      imgSrc: [
        "https://flagcdn.com",
        "https://upload.wikimedia.org",
        "https://thumb.wikimedia.org",
      ],
    }),

    i18n({ defaultLocale: "en" }),
    ui({
      unocss: {
        // Generate CSS during module transforms; Vite+'s Rolldown pipeline has
        // no vite:css-post hook for UnoCSS's global placeholder replacement.
        ...unoBuildMode,
        layers: { site: 10 },
        shortcuts: Object.entries(siteShortcuts).map(
          ([name, utilities]): [string, string, { layer: string }] => [
            name,
            utilities,
            { layer: "site" },
          ],
        ),
        safelist: [
          // Some component templates are compiled before extraction. Keep their
          // semantic shortcuts available in every route's production stylesheet.
          ...Object.keys(siteShortcuts),
          "i-mdi-github",
          "i-mdi-linkedin",
          "i-mdi-instagram",
          "i-mdi-discord",
          "i-mdi-spotify",
          "i-mdi-home-outline",
          "i-mdi-post-outline",
          "i-mdi-file-account-outline",
          "i-mdi-message-text-outline",
          "i-mdi-email-outline",
          "i-mdi-whatsapp",
          "i-mdi-file-document-outline",
          "i-mdi-compass-outline",
          "i-mdi-send-outline",
          "i-mdi-shield-check-outline",
        ],
      },
      colors: {
        neutral: {
          light: {
            50: "#ffffff",
            100: "oklch(.965 0 0)",
            200: "oklch(.925 0 0)",
            300: "oklch(.85 0 0)",
            400: "oklch(.72 0 0)",
            500: "oklch(.55 0 0)",
            600: "oklch(.44 0 0)",
            700: "oklch(.35 0 0)",
            800: "oklch(.27 0 0)",
            900: "oklch(.2 0 0)",
            950: "oklch(.145 0 0)",
          },
          dark: {
            50: "oklch(.145 0 0)",
            100: "oklch(.2 0 0)",
            200: "oklch(.28 0 0)",
            300: "oklch(.35 0 0)",
            400: "oklch(.44 0 0)",
            500: "oklch(.53 0 0)",
            600: "oklch(.61 0 0)",
            700: "oklch(.69 0 0)",
            800: "oklch(.77 0 0)",
            900: "oklch(.86 0 0)",
            950: "#ffffff",
          },
        },
        primary: {
          light: {
            50: "#4b3000",
            100: "#674100",
            200: "#805000",
            300: "#ffbf00",
            400: "#ffca24",
            500: "#ffbf00",
            600: "#d99c00",
            700: "#c79936",
            800: "#e8cf93",
            900: "#f6e7bf",
            950: "#fff7e2",
          },
          dark: {
            50: "#fff8dc",
            100: "#ffecae",
            200: "#ffdd70",
            300: "#ffda4f",
            400: "#ffc91a",
            500: "#ffbf00",
            600: "#d99c00",
            700: "#805b00",
            800: "#503700",
            900: "#302100",
            950: "#1c1400",
          },
        },
        secondary: {
          light: {
            50: "#4b3000",
            100: "#674100",
            200: "#805000",
            300: "#ffbf00",
            400: "#ffca24",
            500: "#ffbf00",
            600: "#d99c00",
            700: "#c79936",
            800: "#f6e7bf",
            900: "#fbf1d7",
            950: "#fff9ea",
          },
          dark: {
            50: "#fff8dc",
            100: "#ffecae",
            200: "#ffdd70",
            300: "#ffda4f",
            400: "#ffc91a",
            500: "#ffbf00",
            600: "#d99c00",
            700: "#805b00",
            800: "#302100",
            900: "#1c1400",
            950: "#100b00",
          },
        },
      },
    }),
  ],
});
