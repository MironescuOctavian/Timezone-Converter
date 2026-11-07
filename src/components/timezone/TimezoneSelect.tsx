import { createMemo, createSignal, For, onSettled, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { t } from "@rimelight/i18n";
import type { TimezoneGroup } from "./TimezoneOptions";

type Option = TimezoneGroup["options"][number];

// Keep a native select as the value/event adapter while presenting flags and searchable groups.
export function TimezoneSelect(props: {
  groups: TimezoneGroup[];
  localLabel: string;
  value: string;
  selectedFlag?: string | undefined;
  label: string;
  children?: JSX.Element;
  class?: string;
  style?: JSX.CSSProperties;
  ref?: (element: HTMLSelectElement) => void;
  triggerRef?: (element: HTMLButtonElement) => void;
  onChange: (event: Event & { currentTarget: HTMLSelectElement }) => void;
}) {
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [expanded, setExpanded] = createSignal("");
  const [active, setActive] = createSignal(0);
  let root: HTMLDivElement | undefined;
  let native: HTMLSelectElement | undefined;
  let trigger: HTMLButtonElement | undefined;
  let input: HTMLInputElement | undefined;
  const selected = createMemo(() =>
    props.groups
      .flatMap((group) => group.options)
      .find(
        (item) =>
          (props.value === "__local__"
            ? item.label === props.localLabel ||
              (!!props.selectedFlag && item.flag === props.selectedFlag)
            : (item.value ?? item.zone) === props.value) &&
          (!props.selectedFlag || item.flag === props.selectedFlag),
      ),
  );
  const sections = createMemo(() => {
    const search = query().trim().toLocaleLowerCase();
    let remaining = search ? 50 : Number.POSITIVE_INFINITY;
    return props.groups
      .map((group) => {
        const matches = search
          ? group.options.filter((item) =>
              `${item.label} ${item.zone}`.toLocaleLowerCase().includes(search),
            )
          : group.options;
        const isExpanded = !!search || expanded() === group.label;
        const options = isExpanded ? matches.slice(0, remaining) : [];
        remaining -= options.length;
        return { label: group.label, count: matches.length, options, expanded: isExpanded };
      })
      .filter((group) => group.count > 0);
  });
  const visible = createMemo(() => sections().flatMap((group) => group.options));
  function close() {
    setOpen(false);
    trigger?.focus();
  }
  function choose(item?: Option) {
    if (!native) return;
    const value = item ? (item.value ?? item.zone) : "__local__";
    const index = [...native.options].findIndex(
      (option) => option.value === value && (!item || option.dataset["countryFlag"] === item.flag),
    );
    if (index < 0) return;
    native.selectedIndex = index;
    native.dispatchEvent(new Event("change", { bubbles: true }));
    close();
  }
  function show() {
    setQuery("");
    setActive(0);
    setExpanded(
      props.groups.find((group) => group.options.includes(selected()!))?.label ??
        props.groups[0]?.label ??
        "",
    );
    setOpen(true);
    requestAnimationFrame(() => input?.focus());
  }
  onSettled(() => {
    const outside = (event: PointerEvent) => {
      if (root && !root.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  });
  return (
    <div
      ref={(element) => {
        root = element;
      }}
      class="relative min-w-0"
    >
      <select
        hidden
        aria-hidden="true"
        tabindex="-1"
        ref={(element) => {
          native = element;
          props.ref?.(element);
        }}
        value={props.value}
        onChange={props.onChange}
      >
        {props.children}
      </select>
      <button
        ref={(element) => {
          trigger = element;
          props.triggerRef?.(element);
        }}
        type="button"
        class="relative flex min-h-14 w-full items-center justify-center rounded-xl border border-primary-700/50 bg-default px-10 py-3 text-center text-base text-neutral-950 hover:border-primary-500 focus-visible:outline-2 focus-visible:outline-primary-500"
        style={props.style}
        aria-label={props.label}
        aria-haspopup="listbox"
        aria-expanded={open() ? "true" : "false"}
        onClick={() => (open() ? close() : show())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            show();
          }
        }}
      >
        <span class="inline-flex min-w-0 max-w-full items-center justify-center gap-3">
          <Show when={selected()}>
            {(item) => (
              <img
                src={`https://flagcdn.com/w40/${item().flag}.png`}
                alt=""
                width="24"
                height="16"
                class="h-4 w-6 shrink-0 rounded-sm object-cover"
              />
            )}
          </Show>
          <span class="min-w-0 truncate">
            {props.value === "__local__" ? props.localLabel : (selected()?.label ?? props.value)}
          </span>
        </span>
        <span
          class="i-lucide-chevron-down absolute right-4 size-4 text-primary-500"
          aria-hidden="true"
        />
      </button>
      <Show when={open()}>
        <div
          class="absolute left-0 right-0 top-full z-40 mt-2 min-w-0 overflow-hidden rounded-2xl border border-primary-700 bg-neutral-50 shadow-[0_16px_45px_#0006]"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
            }
            if (event.key === "Tab") setOpen(false);
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const next = Math.max(
                0,
                Math.min(visible().length - 1, active() + (event.key === "ArrowDown" ? 1 : -1)),
              );
              setActive(next);
              root
                ?.querySelector(`[data-option-index="${next}"]`)
                ?.scrollIntoView({ block: "nearest" });
            }
            if (event.key === "Enter" && event.target === input) {
              event.preventDefault();
              const item = visible()[active()];
              if (item) choose(item);
            }
          }}
        >
          <div class="border-b border-primary-700/40 p-3">
            <input
              ref={(element) => {
                input = element;
              }}
              type="search"
              class="h-10 w-full rounded-lg border border-primary-700/50 bg-default px-3 text-sm"
              aria-label={t.raw(
                "timezone.searchTimezones",
                "Search countries, cities or timezones",
              )}
              placeholder={t.raw(
                "timezone.searchTimezones",
                "Search countries, cities or timezones",
              )}
              value={query()}
              onInput={(event) => {
                setQuery(event.currentTarget.value);
                setActive(0);
              }}
            />
          </div>
          <div
            class="max-h-72 overflow-y-auto overscroll-contain p-2"
            role="listbox"
            aria-label={props.label}
          >
            <button
              type="button"
              class="mb-2 w-full rounded-lg bg-primary-500/10 px-3 py-2 text-left text-sm font-semibold text-primary-500"
              onClick={() => choose()}
            >
              {props.localLabel}
            </button>
            <For each={sections()}>
              {(group) => (
                <div class="border-t border-primary-700/40">
                  <button
                    type="button"
                    class="flex w-full items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary-500"
                    aria-expanded={group.expanded ? "true" : "false"}
                    onClick={() => {
                      setExpanded(group.expanded ? "" : group.label);
                      setActive(0);
                    }}
                  >
                    <span>{group.label}</span>
                    <span class="text-[10px] opacity-70">
                      {group.count} {group.expanded ? "−" : "+"}
                    </span>
                  </button>
                  <For each={group.options}>
                    {(item) => (
                      <button
                        type="button"
                        role="option"
                        aria-selected={
                          props.value === (item.value ?? item.zone) &&
                          (!props.selectedFlag || props.selectedFlag === item.flag)
                            ? "true"
                            : "false"
                        }
                        data-option-index={visible().indexOf(item)}
                        class={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-primary-500/10 ${visible()[active()] === item ? "bg-primary-500/10" : ""}`}
                        onClick={() => choose(item)}
                      >
                        <img
                          src={`https://flagcdn.com/w40/${item.flag}.png`}
                          alt=""
                          width="24"
                          height="16"
                          loading="lazy"
                          class="h-4 w-6 shrink-0 rounded-sm object-cover"
                        />
                        <span class="min-w-0 flex-1">
                          <span class="block truncate font-semibold">{item.label}</span>
                          <span class="block truncate text-[11px] opacity-55">
                            {item.zone.replaceAll("_", " ")}
                          </span>
                        </span>
                      </button>
                    )}
                  </For>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
