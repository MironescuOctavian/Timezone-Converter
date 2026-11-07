import { createContext, createSignal, onSettled, useContext } from "solid-js";
import type { JSX } from "@solidjs/web";

const GlobeActivation = createContext<{
  enabled: () => boolean;
  enable: () => void;
}>();
const enabledDocuments = new WeakSet<Document>();

// The router can remount layouts. Keep activation in document memory, never storage
// or server state, so route changes retain it and full reloads start disabled.
export function GlobeActivationProvider(props: { children?: JSX.Element }) {
  const [enabled, setEnabled] = createSignal(
    typeof document !== "undefined" && enabledDocuments.has(document),
  );
  onSettled(() => {
    if (enabledDocuments.has(document)) setEnabled(true);
  });
  return (
    <GlobeActivation
      value={{
        enabled,
        enable: () => {
          enabledDocuments.add(document);
          setEnabled(true);
        },
      }}
    >
      {props.children}
    </GlobeActivation>
  );
}
export const useGlobeActivation = () => useContext(GlobeActivation)!;
