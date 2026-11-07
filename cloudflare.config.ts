/** @file Defines the Worker deployment, Durable Object exports, bindings, caching, and observability settings. */

import { bindings, defineConfig, exports } from "cf/config";

// Keep the deployed Worker and its local Durable Object binding in sync.
const workerName = "timezone-converter";

export default defineConfig({
  worker: {
    name: workerName,
    compatibilityDate: "2026-10-01",
    entrypoint: "./src/fetch.ts",
    exports: {
      GlobePresence: exports.durableObject({ storage: "sqlite" }),
      ConversionCounter: exports.durableObject({ storage: "sqlite" }),
    },
    observability: {
      // Automatic request diagnostics can retain connection metadata.
      enabled: false,
      logs: { enabled: false, invocationLogs: false, persist: false },
      traces: {
        enabled: false,
      },
      issues: {
        enabled: false,
      },
    },
    logpush: false,
    cache: {
      enabled: true,
    },
    env: {
      ASSETS: bindings.assets(),
      GLOBE_PRESENCE: bindings.durableObject({
        worker: workerName,
        exportName: "GlobePresence",
      }),
      CONVERSION_COUNTER: bindings.durableObject({
        worker: workerName,
        exportName: "ConversionCounter",
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
