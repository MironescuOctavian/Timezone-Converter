import { getLocaleUrl, t } from "@rimelight/i18n";
import { RLHeader } from "@rimelight/ui";
import { useParams } from "@solidjs/router";
import { createSignal, onSettled } from "solid-js";
import { LanguagePicker, ThemePicker } from "./SettingsPickers";

export interface AppHeaderProps {
  stackIndex?: number;
}

export default function AppHeader(props: AppHeaderProps) {
  const params = useParams();
  const [progress, setProgress] = createSignal(0);
  onSettled(() => {
    const update = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  });
  return (
    <>
      <RLHeader
        contain
        fixed
        stackIndex={props.stackIndex ?? 50}
        class="border-b border-primary-700/60 bg-neutral-50/95 text-neutral-950 backdrop-blur-xl"
        ui={{
          container: () =>
            "mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8",
          left: () => "flex min-w-0 shrink-0 items-center",
          center: () => "hidden min-w-0 flex-1 items-center justify-center min-[1000px]:flex",
          right: () => "flex shrink-0 items-center justify-end",
        }}
        left={
          <a
            href={getLocaleUrl("/", params["locale"])}
            class="inline-flex items-center gap-3 font-bold tracking-tight text-neutral-950"
            aria-label={`Timezone Converter · ${t("timezone.navHome")}`}
          >
            <span class="i-lucide-code-xml size-7 text-primary-400" aria-hidden="true" />
            <span class="whitespace-nowrap text-sm sm:text-base">
              Timezone Converter<span class="text-primary-300">.</span>
            </span>
          </a>
        }
        center={
          <nav
            class="flex items-center gap-1 whitespace-nowrap"
            aria-label={t("timezone.pageSections")}
          >
            <a
              href={getLocaleUrl("/", params["locale"])}
              class="rounded-full px-4 py-2 text-sm font-bold text-primary-500 hover:bg-primary-500/15"
            >
              {t("timezone.pageTitle")}
            </a>
            <a
              href={getLocaleUrl("/world-clock", params["locale"])}
              class="rounded-full px-4 py-2 text-sm font-bold text-primary-500 hover:bg-primary-500/15"
            >
              {t("timezone.worldClock")}
            </a>
          </nav>
        }
        right={
          <div class="flex items-center gap-2">
            <a
              href={getLocaleUrl("/world-clock", params["locale"])}
              class="whitespace-nowrap text-xs font-bold text-primary-500 min-[1000px]:hidden"
            >
              {t("timezone.worldClock")}
            </a>
            <a
              href="https://octavianmironescu.com/en/contact"
              class="hidden min-h-12 items-center justify-center whitespace-nowrap rounded-full bg-primary-500 px-4 text-sm font-bold text-black sm:inline-flex lg:px-6"
            >
              {t("timezone.contact")}
            </a>
            <ThemePicker />
            <LanguagePicker />
          </div>
        }
      />
      <div
        aria-hidden="true"
        class="pointer-events-none fixed left-0 z-50 h-0.5 w-full bg-primary-700/20"
        style={{ top: "calc(var(--rl-header-height, 4.5rem) - 2px)" }}
      >
        <div
          class="h-full origin-left bg-primary-500"
          style={{ transform: `scaleX(${progress()})` }}
        />
      </div>
    </>
  );
}
