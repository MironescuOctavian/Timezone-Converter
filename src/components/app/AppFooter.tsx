import { getLocaleUrl, t } from "@rimelight/i18n";
import { useParams } from "@solidjs/router";
import { LanguagePicker, ThemePicker } from "./SettingsPickers";

export default function AppFooter() {
  // Read the route parameter directly: footer rendering can outlive the i18n request scope during SSR.
  const params = useParams();
  return (
    <footer class="site-footer border-t border-primary-700 bg-neutral-50 text-neutral-950">
      <div class="mx-auto grid max-w-7xl gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.2fr] lg:px-10">
        <div>
          <a
            href={getLocaleUrl("/", params["locale"])}
            class="inline-flex items-center gap-2 text-lg font-bold"
          >
            <span class="i-lucide-code-xml size-7 text-primary-400" aria-hidden="true" />
            Mironescu Octavian<span class="text-primary-300">.</span>
          </a>
          <p class="mt-3 text-sm opacity-70">
            {t.raw("timezone.tagline", "Never stop searching.")}
          </p>
          <p class="mt-2 text-xs opacity-55">© {new Date().getFullYear()} octavianmironescu.com</p>
        </div>
        <div class="sm:justify-self-start sm:pl-4">
          <h2 class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-500">
            <span class="i-mdi-shield-check-outline size-4" aria-hidden="true" />
            {t.raw("timezone.legal", "Legal")}
          </h2>
          <a
            class="mt-3 inline-block text-sm hover:text-primary-500"
            href={getLocaleUrl("/legal/privacy-policy", params["locale"])}
          >
            {t.raw("timezone.privacyPolicy", "Privacy policy")}
          </a>
        </div>
        <div>
          <h2 class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-500">
            <span class="i-mdi-github size-4" aria-hidden="true" />
            GitHub
          </h2>
          {/* Add href when the repository is published. */}
          <a
            role="link"
            aria-disabled="true"
            class="mt-3 inline-block text-sm opacity-60"
            title={t.raw("timezone.githubSoon", "Project repository coming soon")}
          >
            {t.raw("timezone.comingSoon", "Coming soon")}
          </a>
        </div>
        <div class="sm:justify-self-end sm:w-full sm:max-w-xs">
          <h2 class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-500">
            <span class="i-mdi-send-outline size-4" aria-hidden="true" />
            {t.raw("timezone.contact", "Contact")}
          </h2>
          <div class="mt-3 grid gap-1 text-sm">
            <a
              href="https://octavianmironescu.com/en/contact"
              class="group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-primary-500/10 hover:text-primary-500 focus-visible:outline-2 focus-visible:outline-primary-500"
            >
              <span
                class="i-mdi-message-text-outline size-4 shrink-0 text-primary-500"
                aria-hidden="true"
              />
              <span class="flex-1 font-semibold">
                {t.raw("timezone.getInTouch", "Get in touch")}
              </span>
              <span aria-hidden="true">↗</span>
            </a>
            <a
              href="mailto:omironescu@gmail.com"
              class="group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-primary-500/10 hover:text-primary-500 focus-visible:outline-2 focus-visible:outline-primary-500"
            >
              <span
                class="i-mdi-email-outline size-4 shrink-0 text-primary-500"
                aria-hidden="true"
              />
              <span class="min-w-0 flex-1 break-all">omironescu@gmail.com</span>
              <span aria-hidden="true">↗</span>
            </a>
            <a
              href="https://wa.me/40729616906"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-primary-500/10 hover:text-primary-500 focus-visible:outline-2 focus-visible:outline-primary-500"
            >
              <span class="i-mdi-whatsapp size-4 shrink-0 text-primary-500" aria-hidden="true" />
              <span class="flex-1">WhatsApp</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div class="mt-4 flex gap-2 sm:justify-end">
            <ThemePicker />
            <LanguagePicker />
          </div>
        </div>
      </div>
    </footer>
  );
}
