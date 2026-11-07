import type { RouteSectionProps } from "@solidjs/router";
import AppHeader from "#components/app/AppHeader";
import AppFooter from "#components/app/AppFooter";
import { SiteBackground } from "#components/app/SiteBackground";
import { PresenceProvider } from "#components/timezone/Presence";
import { GlobeActivationProvider } from "#components/timezone/GlobeActivation";
import { DistanceProvider } from "#components/timezone/Distance";
import "#components/app/app-theme.css";
import {
  RLMain,
  RLScrollToTop,
  RLShortcuts,
  RLToaster,
  RLRouteAnnouncer,
  RLLayoutGrid,
} from "@rimelight/ui";

export default function AppRouteLayout(props: RouteSectionProps) {
  return (
    <GlobeActivationProvider>
      <PresenceProvider>
        <DistanceProvider>
          <div class="site-shell isolate flex flex-col min-h-screen">
            <SiteBackground />
            <AppHeader />
            <RLMain>{props.children}</RLMain>
            <AppFooter />
            <RLScrollToTop />
            <RLShortcuts />
            <RLToaster />
            <RLRouteAnnouncer />
            <RLLayoutGrid />
          </div>
        </DistanceProvider>
      </PresenceProvider>
    </GlobeActivationProvider>
  );
}
