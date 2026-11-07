/** @file Displays the static globe preview and its enable or loading state. */

import { t } from "@rimelight/i18n";
import { RLButton } from "@rimelight/ui";

export function GlobePlaceholder(props: { loading?: boolean; onEnable?: () => void }) {
  return (
    <div class="globe-stage relative min-w-0">
      <div class="relative grid h-full min-h-72 place-items-center overflow-hidden rounded-2xl">
        <img
          src="/globe-preview.svg"
          alt=""
          width="640"
          height="640"
          loading="lazy"
          decoding="async"
          class="absolute inset-0 h-full w-full object-contain opacity-55"
        />
        <div class="relative z-10 mx-4 grid max-w-sm justify-items-center gap-3 rounded-2xl border border-primary-700/40 bg-neutral-50/95 p-5 text-center shadow-lg">
          <RLButton
            color="primary"
            size="lg"
            class="globe-enable-button justify-center gap-2 rounded-full px-5 font-bold"
            disabled={props.loading}
            onClick={props.onEnable}
          >
            <span class="i-lucide-globe-2 size-5" aria-hidden="true" />
            {props.loading ? t("timezone.loadingGlobe") : t("timezone.enableGlobe")}
          </RLButton>
          <p class="text-xs leading-relaxed text-neutral-950/70">{t("timezone.globeOnDemand")}</p>
        </div>
      </div>
    </div>
  );
}
