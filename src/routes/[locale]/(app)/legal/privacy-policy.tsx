/** @file Renders localized explanations of data use, optional regional presence, and distance estimates. */

import { t } from "@rimelight/i18n";

export default function PrivacyPolicy() {
  return (
    <main class="mx-auto max-w-3xl px-6 py-16 text-neutral-950">
      <p class="text-xs font-bold uppercase tracking-widest text-primary-500">
        {t("timezone.legal")}
      </p>
      <h1 class="mt-3 text-4xl font-bold">{t("timezone.privacyPolicy")}</h1>
      <div class="mt-8 grid gap-6 text-base leading-relaxed">
        <p>{t("privacy.intro")}</p>
        <section>
          <h2 class="text-xl font-bold">{t("privacy.localTitle")}</h2>
          <p class="mt-2">{t("privacy.localText")}</p>
        </section>
        <section>
          <h2 class="text-xl font-bold">{t("privacy.servicesTitle")}</h2>
          <p class="mt-2">{t("privacy.servicesText")}</p>
        </section>
        <section>
          <h2 class="text-xl font-bold">{t("privacy.presenceTitle")}</h2>
          <p class="mt-2">{t("privacy.presenceText")}</p>
        </section>
        <section>
          <h2 class="text-xl font-bold">{t("privacy.distanceTitle")}</h2>
          <p class="mt-2">{t("privacy.distanceText")}</p>
        </section>
        <section>
          <h2 class="text-xl font-bold">{t("privacy.sharingTitle")}</h2>
          <p class="mt-2">{t("privacy.sharingText")}</p>
        </section>
        <section>
          <h2 class="text-xl font-bold">{t("privacy.contactTitle")}</h2>
          <p class="mt-2">
            {t("privacy.contactText")}{" "}
            <a class="text-primary-500 underline" href="mailto:omironescu@gmail.com">
              omironescu@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
