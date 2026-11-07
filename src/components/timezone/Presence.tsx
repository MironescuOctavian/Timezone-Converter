import { createContext, createSignal, onSettled, useContext } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { PresenceMessage, ViewerCity, ViewerLocation } from "#presence/shared";

type Presence = ReturnType<typeof createPresence>;
const PresenceContext = createContext<Presence>();
export const usePresence = () => useContext(PresenceContext);

function createPresence() {
  const [cities, setCities] = createSignal<ViewerCity[]>([]);
  const [total, setTotal] = createSignal(0);
  const [location, setLocation] = createSignal<ViewerLocation | null>(null);
  const [connected, setConnected] = createSignal(false);
  const [hidden, setHidden] = createSignal(false);
  let restart: (hide: boolean) => void = () => {};

  onSettled(() => {
    let stopped = false,
      retries = 0;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let awaitingPong = false;
    let hide = false;
    try {
      hide = localStorage.getItem("hide-globe-presence") === "true";
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
      setCities([]);
      setTotal(0);
      setLocation(null);
    }
    function connect() {
      if (stopped) return;
      const url = new URL("/api/presence", window.location.origin);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      if (hide) url.searchParams.set("share", "0");
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
          if (message.type === "welcome") setLocation(message.location);
          if (message.type === "snapshot") {
            setCities(message.cities);
            setTotal(message.total);
          }
        } catch {
          /* Ignore unrelated or malformed messages. */
        }
      };
      current.onclose = () => {
        clearInterval(heartbeat);
        setConnected(false);
        setCities([]);
        setTotal(0);
        setLocation(null);
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
        connect();
      }
    };
    window.addEventListener("pagehide", leave);
    window.addEventListener("pageshow", resume);
    connect();
    return () => {
      stopped = true;
      disconnect();
      restart = () => {};
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("pageshow", resume);
    };
  });
  return {
    cities,
    total,
    location,
    connected,
    hidden,
    toggle() {
      const value = !hidden();
      setHidden(value);
      try {
        localStorage.setItem("hide-globe-presence", String(value));
      } catch {
        /* Still works for this visit. */
      }
      restart(value);
    },
  };
}

// One connection for the whole site, even when navigating between its pages.
export function PresenceProvider(props: { children?: JSX.Element }) {
  return <PresenceContext value={createPresence()}>{props.children}</PresenceContext>;
}
