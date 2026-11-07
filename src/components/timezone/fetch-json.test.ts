/** @file Tests shared requests, independent cancellation, cached responses, and retries after failure. */

import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { fetchPublicJson } from "./fetch-json";

afterEach(() => vi.unstubAllGlobals());
describe("public request sharing", () => {
  it("shares concurrent requests and cached results without sharing cancellation", async () => {
    let complete!: (value: Response) => void;
    const fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          complete = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetch);
    const first = new AbortController(),
      second = new AbortController();
    const a = fetchPublicJson("https://example.test/shared", first.signal);
    const b = fetchPublicJson("https://example.test/shared", second.signal);
    const rejected = expect(a).rejects.toBeDefined();
    first.abort();
    complete(Response.json({ value: 1 }));
    await rejected;
    expect(await b).toEqual({ value: 1 });
    expect(await fetchPublicJson("https://example.test/shared", second.signal)).toEqual({
      value: 1,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("does not cache failures and aborts the upstream when every consumer leaves", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetch);
    const controller = new AbortController();
    await expect(
      fetchPublicJson("https://example.test/retry", controller.signal),
    ).rejects.toThrow();
    expect(await fetchPublicJson("https://example.test/retry", controller.signal)).toEqual({
      ok: true,
    });
    let upstream: AbortSignal | undefined;
    fetch.mockImplementationOnce((_url, options) => {
      upstream = options.signal;
      return new Promise((_resolve, reject) =>
        upstream!.addEventListener("abort", () => reject(upstream!.reason)),
      );
    });
    const request = fetchPublicJson("https://example.test/abort", controller.signal);
    const rejected = expect(request).rejects.toBeDefined();
    controller.abort();
    await rejected;
    expect(upstream!.aborted).toBe(true);
  });
});
