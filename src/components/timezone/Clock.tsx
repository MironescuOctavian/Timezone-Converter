import { For } from "solid-js";
import { clockParts } from "./data";

// Keep formatting in one place so all clocks display the same timezone rules.
export function AmberClock(props: {
  date: Date | undefined;
  zone: string | undefined;
  full?: boolean;
}) {
  return (
    <For keyed={false} each={clockParts(props.date, props.zone, props.full)}>
      {(part) => <span>{part().value}</span>}
    </For>
  );
}
