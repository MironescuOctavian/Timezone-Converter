import { createContext, createEffect, createSignal, useContext } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { PresenceMessage, ViewerRegion } from "#presence/regions";
import { REGION_SHARING_KEY, regionSharingEnabled } from "#presence/consent";
import { useGlobeActivation } from "./GlobeActivation";

type Presence = ReturnType<typeof createPresence>;
const PresenceContext = createContext<Presence>();
export const usePresence = () => useContext(PresenceContext);

/**
 * Real-time Presence Client Hook / Context.
 *
 * Manages the WebSocket lifecycle connecting to `/api/presence`:
 * - Opens a WebSocket when the interactive globe is activated.
 * - Sends regular 30s ping heartbeats to maintain the connection.
 * - Handles exponential backoff reconnection on network loss.
 * - Reads user privacy preference (`regionSharingEnabled`) to determine whether
 *   the visitor's coarse region should be shared or hidden.
 * - Receives batched snapshots containing active viewer count and continental clusters.
 */
function createPresence(enabled: () => boolean) {

  const [regions, setRegions] = createSignal<ViewerRegion[]>([]);
  const [ready, setReady] = createSignal(false);
  const [total, setTotal] = createSignal(0);
  const [sharing, setSharing] = createSignal(false);
  const [connected, setConnected] = createSignal(false);
  const [hidden, setHidden] = createSignal(true);
  let restart: (hide: boolean) => void = () => {};

  createEffect(enabled, (active) => {
    if (!active) return;
    let stopped = false,
      retries = 0;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let awaitingPong = false;
    let hide = true;
    try {
      // Older opt-out preferences never count as consent to the new policy.
      hide = !regionSharingEnabled(localStorage);
      localStorage.removeItem("hide-globe-presence");
    } catch {
      /* Storage is optional. */
    }
    setHidden(hide);

    function disconnect() {
      clearTimeout(retry);
      clearInterval(heartbeat);
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onclose = null;
        socket.close();
      }
      socket = undefined;
      setConnected(false);
      setRegions([]);
      setReady(false);
      setTotal(0);
      setSharing(false);
    }
    function connect() {
      if (stopped) return;
      const url = new URL("/api/presence", window.location.origin);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.searchParams.set("v", "2");
      url.searchParams.set("share", hide ? "0" : "1");
      const current = new WebSocket(url);
      socket = current;
      current.onopen = () => {
        if (socket !== current) return;
        retries = 0;
        awaitingPong = false;
        setConnected(true);
        heartbeat = setInterval(() => {
          if (awaitingPong) {
            current.close();
            return;
          }
          if (current.readyState === WebSocket.OPEN) {
            awaitingPong = true;
            current.send("ping");
          }
        }, 30_000);
      };
      current.onmessage = (event) => {
        if (socket !== current) return;
        if (event.data === "pong") {
          awaitingPong = false;
          return;
        }
        try {
          const message = JSON.parse(String(event.data)) as PresenceMessage;
          if (message.type === "welcome") setSharing(message.sharing);
          if (message.type === "snapshot" && Array.isArray(message.regions)) {
            setRegions(message.regions);
            setReady(message.ready);
            setTotal(message.total);
          }
        } catch {
          /* Ignore unrelated or malformed messages. */
        }
      };
      current.onclose = () => {
        clearInterval(heartbeat);
        setConnected(false);
        setRegions([]);
        setReady(false);
        setTotal(0);
        setSharing(false);
        if (!stopped)
          retry = setTimeout(
            connect,
            Math.min(30_000, 1000 * 2 ** retries++) + Math.random() * 500,
          );
      };
      current.onerror = () => current.close();
    }
    restart = (value) => {
      hide = value;
      setHidden(value);
      if (value && socket?.readyState === WebSocket.OPEN) {
        setSharing(false);
        socket.send("hide");
        return;
      }
      disconnect();
      connect();
    };
    const leave = () => {
      stopped = true;
      disconnect();
    };
    const resume = () => {
      if (stopped) {
        stopped = false;
        // Another tab may have withdrawn consent while this page was cached.
        try {
          hide = !regionSharingEnabled(localStorage);
        } catch {
          hide = true;
        }
        setHidden(hide);
        connect();
      }
    };
    const syncPreference = (event: StorageEvent) => {
      if (event.key === REGION_SHARING_KEY || event.key === null)
        restart(event.newValue !== "true");
    };
    window.addEventListener("storage", syncPreference);
    window.addEventListener("pagehide", leave);
    window.addEventListener("pageshow", resume);
    connect();
    return () => {
      stopped = true;
      disconnect();
      restart = () => {};
      window.removeEventListener("storage", syncPreference);
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("pageshow", resume);
    };
  });
  return {
    regions,
    ready,
    total,
    sharing,
    connected,
    hidden,
    toggle() {
      const value = !hidden();
      setHidden(value);
      try {
        localStorage.setItem(REGION_SHARING_KEY, String(!value));
      } catch {
        /* Still works for this visit. */
      }
      restart(value);
    },
  };
}

// One connection for the whole site, even when navigating between its pages.
export function PresenceProvider(props: { children?: JSX.Element }) {
  const activation = useGlobeActivation();
  return (
    <PresenceContext value={createPresence(activation.enabled)}>{props.children}</PresenceContext>
  );
}
