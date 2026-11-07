import { bindings, defineConfig, exports } from "cf/config";

export default defineConfig({
  worker: {
    name: "octavianmironescu-dot-com",
    compatibilityDate: "2026-10-01",
    entrypoint: "./src/fetch.ts",
    exports: {
      GlobePresence: exports.durableObject({ storage: "sqlite" }),
    },
    observability: {
      enabled: true,
      traces: {
        enabled: true,
      },
      issues: {
        enabled: true,
      },
    },
    cache: {
      enabled: true,
    },
    env: {
      ASSETS: bindings.assets(),
      GLOBE_PRESENCE: bindings.durableObject({
        worker: "octavianmironescu-dot-com",
        exportName: "GlobePresence",
      }),
      IMAGES: bindings.images(),
      BLOB: bindings.r2({
        name: "octavianmironescu-dot-com",
      }),
      RATE_LIMIT: bindings.rateLimit({
        namespace: "1001",
        simple: {
          limit: 100,
          period: 60,
        },
      }),
    },
  },
});
