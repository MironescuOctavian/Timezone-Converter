/** @file Builds grouped timezone options with country flags and the visitor's local choice. */

import { For } from "solid-js";

export type TimezoneGroup = {
  label: string;
  options: { zone: string; label: string; flag: string; value?: string; city?: string }[];
};

// Native optgroups keep the list navigable by keyboard and screen reader.
export function TimezoneOptions(props: {
  groups: TimezoneGroup[];
  localLabel: string;
  selected: string;
  selectedFlag?: string | undefined;
}) {
  return (
    <>
      <option value="__local__" selected={props.selected === "__local__"}>
        {props.localLabel}
      </option>
      <For each={props.groups}>
        {(group) => (
          <optgroup class="timezone-option-group" label={group.label}>
            <For each={group.options}>
              {(item) => (
                <option
                  value={item.value ?? item.zone}
                  data-country-flag={item.flag}
                  data-city={item.city}
                  selected={
                    props.selected === (item.value ?? item.zone) &&
                    (!props.selectedFlag || props.selectedFlag === item.flag)
                  }
                >
                  {item.label}
                </option>
              )}
            </For>
          </optgroup>
        )}
      </For>
    </>
  );
}
