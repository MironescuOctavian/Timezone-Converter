/** @file Renders the localized, responsive footer with project links, contact details, and settings. */

import { getLocaleUrl, t } from "@rimelight/i18n";
import { useParams } from "@solidjs/router";
import { LanguagePicker, ThemePicker } from "./SettingsPickers";

export default function AppFooter() {
  // Read the route parameter directly: footer rendering can outlive the i18n request scope during SSR.
  const params = useParams();
  return (
    <footer class="site-footer border-t border-primary-700 bg-neutral-50 text-neutral-950">
      <div class="site-footer-layout">
        <div>
          <a
            href={getLocaleUrl("/", params["locale"])}
            class="inline-flex items-center gap-2 whitespace-nowrap text-lg font-bold"
          >
            <span class="i-lucide-code-xml size-7 text-primary-400" aria-hidden="true" />
            Timezone Converter<span class="text-primary-300">.</span>
          </a>
          <p class="mt-3 text-sm opacity-70">{t("timezone.tagline")}</p>
          <p class="mt-2 text-xs opacity-65">{t("timezone.createdBy")}: Octavian Mironescu</p>
          <p class="mt-2 text-xs opacity-55">© {new Date().getFullYear()} octavianmironescu.com</p>
        </div>
        <div class="min-w-0">
          <h2 class="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-500">
            <span class="i-mdi-shield-check-outline size-4" aria-hidden="true" />
            {t("timezone.legal")}
          </h2>
          <a
            class="mt-3 inline-block text-sm hover:text-primary-500"
            href={getLocaleUrl("/legal/privacy-policy", params["locale"])}
          >
            {t("timezone.privacyPolicy")}
          </a>
        </div>
        <div>
          <h2 class="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-500">
            <span class="i-mdi-github size-4" aria-hidden="true" />
            GitHub
          </h2>
          <a
            href="https://github.com/MironescuOctavian/Timezone-Converter"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 inline-flex items-center gap-2 text-sm hover:text-primary-500"
          >
            Timezone Converter
            <span class="i-lucide-arrow-up-right size-4 text-primary-500" aria-hidden="true" />
          </a>
        </div>
        <div class="min-w-0">
          <h2 class="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-500">
            <span class="i-mdi-send-outline size-4" aria-hidden="true" />
            {t("timezone.contact")}
          </h2>
          <div class="mt-3 grid gap-1 text-sm">
            <a
              href="https://octavianmironescu.com/en/contact"
              class="group flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-primary-500/10 hover:text-primary-500 focus-visible:outline-2 focus-visible:outline-primary-500"
            >
              <span
                class="i-mdi-message-text-outline size-4 shrink-0 text-primary-500"
                aria-hidden="true"
              />
              <span class="font-semibold">{t("timezone.getInTouch")}</span>
              <span aria-hidden="true">↗</span>
            </a>
            <a
              href="mailto:omironescu@gmail.com"
              class="group flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-primary-500/10 hover:text-primary-500 focus-visible:outline-2 focus-visible:outline-primary-500"
            >
              <span
                class="i-mdi-email-outline size-4 shrink-0 text-primary-500"
                aria-hidden="true"
              />
              <span class="min-w-0 break-all">omironescu@gmail.com</span>
              <span aria-hidden="true">↗</span>
            </a>
            <a
              href="https://wa.me/40729616906"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-primary-500/10 hover:text-primary-500 focus-visible:outline-2 focus-visible:outline-primary-500"
            >
              <span class="i-mdi-whatsapp size-4 shrink-0 text-primary-500" aria-hidden="true" />
              <span>WhatsApp</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <div class="flex items-center justify-center gap-2">
          <ThemePicker />
          <LanguagePicker />
        </div>
      </div>
    </footer>
  );
}
