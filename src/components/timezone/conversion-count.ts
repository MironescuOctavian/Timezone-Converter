/** @file Reads the shared conversion total and records settled user edits without counting duplicate renders. */

import { createEffect, createSignal, onSettled } from "solid-js";

export function createConversionCount(conversion: () => string | undefined) {
  const [total, setTotal] = createSignal<number>();
  const controller = new AbortController();
  let lastCounted: string | undefined;
  async function request(method: "GET" | "POST") {
    try {
      const response = await fetch("/api/conversions", { method, signal: controller.signal });
      if (!response.ok) return false;
      const data = (await response.json()) as { total?: number };
      if (!Number.isSafeInteger(data.total) || data.total! < 0 || controller.signal.aborted)
        return false;
      // A slower read must not replace a newer increment with an older total.
      setTotal((previous) => Math.max(previous ?? 0, data.total!));
      return true;
    } catch {
      return false;
    }
  }
  onSettled(() => {
    void request("GET");
    return () => controller.abort();
  });
  createEffect(conversion, (key) => {
    if (!key || key === lastCounted) return;
    // Wait until edits settle, rather than counting every intermediate keystroke.
    const timer = setTimeout(async () => {
      lastCounted = key;
      if (!(await request("POST")) && lastCounted === key) lastCounted = undefined;
    }, 900);
    return () => clearTimeout(timer);
  });
  return total;
}
