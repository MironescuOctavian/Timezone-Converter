import { createSignal, For, onSettled } from "solid-js";
import { t } from "@rimelight/i18n";

const sections = [
  {
    id: "explore",
    icon: "i-lucide-house",
    label: () => t("timezone.navHome"),
    detail: () => t("timezone.navHomeDetail"),
  },
  {
    id: "converter",
    icon: "i-lucide-arrow-left-right",
    label: () => t("timezone.navConverter"),
    detail: () => t("timezone.navConverterDetail"),
  },
  {
    id: "globe",
    icon: "i-lucide-earth",
    label: () => t("timezone.navGlobe"),
    detail: () => t("timezone.navGlobeDetail"),
  },
  {
    id: "world-clocks",
    icon: "i-lucide-clock-3",
    label: () => t("timezone.navClocks"),
    detail: () => t("timezone.navClocksDetail"),
  },
];

export function PageNav() {
  const [active, setActive] = createSignal("explore");
  // Follow the visible section without reading layout on every scroll tick.
  onSettled(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
    );
    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  });
  return (
    <nav class="section-rail" aria-label={t("timezone.pageSections")}>
      <For each={sections}>
        {(section, index) => (
          <a
            href={`#${section.id}`}
            aria-label={section.label()}
            aria-current={active() === section.id ? "location" : undefined}
            onClick={(event) => {
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              const element = document.getElementById(section.id);
              if (!element) return;
              event.preventDefault();
              setActive(section.id);
              element.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "instant"
                  : "smooth",
                block: "start",
              });
            }}
          >
            <span class={`${section.icon} size-5`} aria-hidden="true" />
            <span class="section-rail-tooltip" aria-hidden="true">
              <span class="section-rail-number">0{index() + 1}</span>
              <span>
                <strong>{section.label()}</strong>
                <small>{section.detail()}</small>
              </span>
              <span class="i-lucide-arrow-up-right size-3.5" />
            </span>
          </a>
        )}
      </For>
    </nav>
  );
}
