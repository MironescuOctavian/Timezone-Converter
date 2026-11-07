import { t } from "@rimelight/i18n";

export default function PrivacyPolicy() {
  return (
    <main class="mx-auto max-w-3xl px-6 py-16 text-neutral-950">
      <p class="text-xs font-bold uppercase tracking-widest text-primary-500">
        {t.raw("timezone.legal", "Legal")}
      </p>
      <h1 class="mt-3 text-4xl font-bold">{t.raw("timezone.privacyPolicy", "Privacy policy")}</h1>
      <div class="mt-8 grid gap-6 text-base leading-relaxed">
        <p>
          {t.raw(
            "privacy.intro",
            "This site helps you compare times around the world. You can use it without creating an account.",
          )}
        </p>
        <section>
          <h2 class="text-xl font-bold">{t.raw("privacy.localTitle", "Time and preferences")}</h2>
          <p class="mt-2">
            {t.raw(
              "privacy.localText",
              "Your browser supplies its timezone so the site can show local time. Time conversion happens in your browser. Language and appearance preferences may be stored in your browser or represented in the page address.",
            )}
          </p>
        </section>
        <section>
          <h2 class="text-xl font-bold">
            {t.raw("privacy.servicesTitle", "Third-party services")}
          </h2>
          <p class="mt-2">
            {t.raw(
              "privacy.servicesText",
              "Your browser requests weather and location data from Open-Meteo, city information and images from Wikipedia and Wikimedia, and flags from FlagCDN. These providers receive the request and network information such as your IP address under their own privacy policies.",
            )}
          </p>
        </section>
        <section>
          <h2 class="text-xl font-bold">
            {t.raw("privacy.presenceTitle", "Anonymous live globe")}
          </h2>
          <p class="mt-2">
            {t.raw(
              "privacy.presenceText",
              "While the site is open, a live connection can show your approximate city and timezone on the globe. Cloudflare estimates these from your network connection; we round the coordinates to half-degree steps and group viewers in the same city. The live map does not share names or IP addresses, use precise device location, or keep a visit history. Connection information is removed when you disconnect. Use ‘Hide my dot’ to stay off the map; this preference is saved in your browser. Online counts represent open connections, not verified unique people.",
            )}
          </p>
        </section>
        <section>
          <h2 class="text-xl font-bold">
            {t.raw("privacy.distanceTitle", "City distance estimates")}
          </h2>
          <p class="mt-2">
            {t.raw(
              "privacy.distanceText",
              "Distances are approximate straight-line estimates. Your browser receives a coarsened city location from Cloudflare without caching it. If unavailable, the site may look up the representative city of your browser timezone with Open-Meteo. This estimate does not determine your precise location or hometown. Hiding your public globe dot does not disable your private distance estimates. Your preferred distance unit may be saved in your browser.",
            )}
          </p>
        </section>
        <section>
          <h2 class="text-xl font-bold">{t.raw("privacy.sharingTitle", "Sharing and calendar")}</h2>
          <p class="mt-2">
            {t.raw(
              "privacy.sharingText",
              "Copy buttons write the selected time to your clipboard only when clicked. Google Calendar opens a draft containing the selected time; Google handles information you choose to save there.",
            )}
          </p>
        </section>
        <section>
          <h2 class="text-xl font-bold">
            {t.raw("privacy.contactTitle", "Site operations and contact")}
          </h2>
          <p class="mt-2">
            {t.raw(
              "privacy.contactText",
              "Our hosting and security providers may process request information, including IP addresses, to deliver and protect the site. For privacy questions, email",
            )}{" "}
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
