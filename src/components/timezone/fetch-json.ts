type Pending = { controller: AbortController; promise: Promise<unknown>; users: number };
const pending = new Map<string, Pending>();
const resolved = new Map<string, { value: unknown; expires: number }>();

// Called from browser event/effect handlers, never reactive compute scopes.
// Share public requests while giving each consumer independent cancellation.
export function fetchPublicJson<T>(url: string | URL, signal: AbortSignal): Promise<T> {
  const key = String(url);
  if (signal.aborted) return Promise.reject(signal.reason);
  const cached = resolved.get(key);
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.value as T);
  let request = pending.get(key);
  if (!request) {
    const controller = new AbortController();
    request = { controller, users: 0, promise: Promise.resolve() };
    const current = request;
    request.promise = fetch(key, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw Error("Public data unavailable");
        return response.json();
      })
      .then((value) => {
        if (!controller.signal.aborted) {
          if (resolved.size >= 128) resolved.delete(resolved.keys().next().value!);
          resolved.set(key, { value, expires: Date.now() + 600_000 });
        }
        return value;
      })
      .finally(() => {
        if (pending.get(key) === current) pending.delete(key);
      });
    pending.set(key, request);
  }
  const current = request;
  current.users++;
  return new Promise<T>((resolve, reject) => {
    let finished = false;
    const finish = () => {
      if (finished) return false;
      finished = true;
      signal.removeEventListener("abort", abort);
      if (--current.users === 0 && pending.get(key) === current) {
        pending.delete(key);
        current.controller.abort();
      }
      return true;
    };
    const abort = () => {
      if (finish()) reject(signal.reason);
    };
    signal.addEventListener("abort", abort, { once: true });
    current.promise.then(
      (value) => {
        if (finish()) resolve(value as T);
      },
      (error) => {
        if (finish()) reject(error);
      },
    );
  });
}
