/** @file Connects file-based routing with application loading, error handling, and translation context. */

import { pageRoutes } from "virtual:file-routes";
import { fileRoutes } from "@solidjs/router/fs";
import { createRouter } from "@solidjs/router";
import { RLErrorBoundary } from "@rimelight/ui";
import { RLI18n } from "@rimelight/i18n/solid";
import { Loading } from "solid-js";

/**
 * Solid Router setup driven by file-system routing conventions (`virtual:file-routes`).
 * Routes are auto-discovered from `src/routes/` and mapped using `@solidjs/router/fs`.
 */
const Router = createRouter({ routes: fileRoutes(pageRoutes) });

/**
 * Application Root Component.
 *
 * Wraps the routed page tree with:
 * 1. ErrorBoundary (`RLErrorBoundary`): Catches runtime errors per route, resetting on route changes.
 * 2. Suspense / Loading: Provides fallback UI while async route chunks or resources load.
 * 3. Internationalization (`RLI18n`): Provides translation context and reactive locale switching based on URL pathname.
 */
export default function App() {
  return (
    <Router>
      {(props) => (
        <RLErrorBoundary resetKey={props.location.pathname}>
          <Loading fallback={<main>Loading.</main>}>
            <RLI18n pathname={props.location.pathname}>{props.children}</RLI18n>
          </Loading>
        </RLErrorBoundary>
      )}
    </Router>
  );
}
