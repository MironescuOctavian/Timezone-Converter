import { createMemo, createSignal, createUniqueId, For, onSettled, Show } from "solid-js";
import { getLocaleInfo, getLocaleUrl, t } from "@rimelight/i18n";
import { useParams } from "@solidjs/router";
import {
  getThemePreference,
  serializeThemePreference,
  type ThemePreference,
} from "@rimelight/ui/theme";
import { localeOrder } from "./locales";

type SettingItem = {
  value: string;
  label: string;
  icon?: string;
  flag?: string | undefined;
  description?: string;
};

// Native popovers escape the fixed header's stacking context and provide light
// dismissal. One shared renderer handles both menus and their keyboard navigation.
function SettingsMenu(props: {
  label: string;
  icon: string;
  value: string;
  items: SettingItem[];
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = createSignal(false);
  const menuId = createUniqueId();
  let trigger: HTMLButtonElement | undefined;
  let menu: HTMLDivElement | undefined;
  const buttons = () => [
    ...(menu?.querySelectorAll<HTMLButtonElement>("[role=menuitemradio]") ?? []),
  ];
  function position() {
    if (!menu || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(272, window.innerWidth - 24);
    const height = Math.min(menu.scrollHeight, window.innerHeight * 0.65);
    const top =
      rect.bottom + 8 + height > window.innerHeight - 12
        ? Math.max(12, rect.top - height - 8)
        : rect.bottom + 8;
    menu.style.width = `${width}px`;
    menu.style.left = `${Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12))}px`;
    menu.style.top = `${top}px`;
  }
  function show() {
    if (!menu) return;
    menu.showPopover();
    position();
    setOpen(true);
    buttons()[
      Math.max(
        0,
        props.items.findIndex((item) => item.value === props.value),
      )
    ]?.focus({ preventScroll: true });
  }
  function close() {
    menu?.hidePopover();
    setOpen(false);
    trigger?.focus({ preventScroll: true });
  }
  onSettled(() => {
    const dismiss = () => {
      if (menu?.matches(":popover-open")) {
        menu.hidePopover();
        setOpen(false);
      }
    };
    window.addEventListener("scroll", dismiss, { passive: true });
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss);
      window.removeEventListener("resize", dismiss);
    };
  });
  return (
    <>
      <button
        ref={(element) => {
          trigger = element;
        }}
        type="button"
        class="site-setting-picker"
        aria-label={props.label}
        aria-haspopup="menu"
        aria-controls={menuId}
        popovertarget={menuId}
        aria-expanded={open() ? "true" : "false"}
        onClick={(event) => {
          event.preventDefault();
          if (open()) close();
          else show();
        }}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            show();
          }
        }}
      >
        <span class={`${props.icon} size-4`} aria-hidden="true" />
      </button>
      <div
        ref={(element) => {
          menu = element;
        }}
        class="site-settings-menu"
        id={menuId}
        popover="auto"
        role="menu"
        aria-label={props.label}
        onToggle={(event) => setOpen(event.currentTarget.matches(":popover-open"))}
        onKeyDown={(event) => {
          const options = buttons();
          const current = options.indexOf(document.activeElement as HTMLButtonElement);
          if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
          if (event.key === "Tab") close();
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? options.length - 1
                : event.key === "ArrowDown"
                  ? (current + 1) % options.length
                  : event.key === "ArrowUp"
                    ? (current - 1 + options.length) % options.length
                    : undefined;
          if (next !== undefined) {
            event.preventDefault();
            options[next]?.focus();
          }
        }}
      >
        <p class="site-settings-title">
          <span class={`${props.icon} size-4`} aria-hidden="true" />
          {props.label}
        </p>
        <For each={props.items}>
          {(item) => (
            <button
              type="button"
              role="menuitemradio"
              aria-checked={props.value === item.value ? "true" : "false"}
              onClick={() => {
                close();
                props.onSelect(item.value);
              }}
            >
              <span class="site-settings-item-icon" aria-hidden="true">
                <Show when={item.flag} fallback={<span class={`${item.icon} size-5`} />}>
                  <img
                    src={`https://flagcdn.com/w40/${item.flag}.png`}
                    alt=""
                    width="24"
                    height="17"
                  />
                </Show>
              </span>
              <span class="site-settings-item-copy">
                <strong>{item.label}</strong>
                <small>{item.description ?? item.value.toUpperCase()}</small>
              </span>
              <Show when={props.value === item.value}>
                <span class="i-lucide-check size-4" aria-hidden="true" />
              </Show>
            </button>
          )}
        </For>
      </div>
    </>
  );
}

const languageFlags: Record<string, string> = {
  en: "gb",
  ro: "ro",
  pt: "pt",
  ar: "sa",
  de: "de",
  es: "es",
  fr: "fr",
  hi: "in",
  ru: "ru",
  zh: "cn",
};

export function LanguagePicker() {
  const params = useParams();
  const items = createMemo(() =>
    localeOrder.map((code) => ({
      value: code,
      label: getLocaleInfo(code).label,
      flag: languageFlags[code],
    })),
  );
  return (
    <SettingsMenu
      label={t.raw("timezone.language", "Language")}
      icon="i-lucide-languages"
      items={items()}
      value={params["locale"] ?? "en"}
      onSelect={(code) => {
        if (!localeOrder.includes(code)) return;
        window.location.assign(
          getLocaleUrl(window.location.pathname + window.location.search, code) +
            window.location.hash,
        );
      }}
    />
  );
}

export function ThemePicker() {
  const [preference, setPreference] = createSignal<ThemePreference>(
    getThemePreference() ?? "system",
  );
  onSettled(() => {
    const sync = () => {
      setPreference(getThemePreference() ?? "system");
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    window.addEventListener("pageshow", sync);
    sync();
    return () => {
      observer.disconnect();
      window.removeEventListener("pageshow", sync);
    };
  });
  const options = createMemo(() => [
    {
      value: "system",
      icon: "i-lucide-laptop",
      label: t.raw("timezone.systemTheme", "System"),
      description: t.raw("timezone.systemThemeDetail", "Follow your device"),
    },
    {
      value: "light",
      icon: "i-lucide-sun",
      label: t.raw("timezone.lightTheme", "Light"),
      description: t.raw("timezone.lightThemeDetail", "Warm and bright"),
    },
    {
      value: "dark",
      icon: "i-lucide-moon",
      label: t.raw("timezone.darkTheme", "Dark"),
      description: t.raw("timezone.darkThemeDetail", "Low-light comfort"),
    },
  ]);
  return (
    <SettingsMenu
      label={t.raw("timezone.theme", "Theme")}
      items={options()}
      icon={
        preference() === "light"
          ? "i-lucide-sun"
          : preference() === "dark"
            ? "i-lucide-moon"
            : "i-lucide-laptop"
      }
      value={preference()}
      onSelect={(value) => {
        const next = value as ThemePreference;
        if (!["light", "dark", "system"].includes(next)) return;
        document.cookie = serializeThemePreference(next);
        if (next === "system") document.documentElement.removeAttribute("data-theme");
        else document.documentElement.setAttribute("data-theme", next);
        setPreference(next);
      }}
    />
  );
}
