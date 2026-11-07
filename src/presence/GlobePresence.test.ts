/** @file Tests batched presence updates, immediate withdrawal, legacy-data cleanup, and alarm lifecycle. */

import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { GlobePresence } from "./GlobePresence";
import type { PresenceAttachment, PresenceMessage } from "./regions";

vi.mock("cloudflare:workers", () => ({
  DurableObject: class {
    ctx: DurableObjectState;
    constructor(ctx: DurableObjectState) {
      this.ctx = ctx;
    }
  },
}));
afterEach(() => vi.unstubAllGlobals());

class Socket {
  readyState = 1;
  messages: PresenceMessage[] = [];
  constructor(public attachment: unknown = { version: 2, region: "EU" }) {}
  deserializeAttachment() {
    return this.attachment;
  }
  serializeAttachment(value: PresenceAttachment) {
    this.attachment = value;
  }
  send(value: string) {
    this.messages.push(JSON.parse(value));
  }
  close() {
    this.readyState = 3;
  }
}
async function fixture(sockets: Socket[]) {
  vi.stubGlobal("WebSocketRequestResponsePair", class {});
  const data = new Map<string, unknown>();
  const startup: Promise<unknown>[] = [];
  let alarm: number | null = null;
  const storage = {
    get: vi.fn(async (key: string) => data.get(key)),
    put: vi.fn(async (key: string, value: unknown) => {
      data.set(key, structuredClone(value));
    }),
    delete: vi.fn(async (key: string) => data.delete(key)),
    getAlarm: vi.fn(async () => alarm),
    setAlarm: vi.fn(async (value: number) => {
      alarm = value;
    }),
    deleteAlarm: vi.fn(async () => {
      alarm = null;
    }),
  };
  const ctx = {
    storage,
    getWebSockets: () => sockets,
    setWebSocketAutoResponse: vi.fn(),
    blockConcurrencyWhile: (fn: () => Promise<unknown>) => {
      const promise = fn();
      startup.push(promise);
      return promise;
    },
  } as unknown as DurableObjectState;
  const object = new GlobePresence(ctx, {} as Env);
  await Promise.all(startup);
  return { object, storage, data, ctx };
}
describe("regional presence lifecycle", () => {
  it("publishes bounded batches using hibernation-safe alarms", async () => {
    const sockets = Array.from({ length: 5 }, () => new Socket());
    const { object, storage, data } = await fixture(sockets);
    expect(sockets[0]!.messages).toEqual([]);
    const before = Date.now();
    await object.alarm();
    expect(storage.setAlarm).toHaveBeenCalledWith(expect.any(Number));
    expect(storage.setAlarm.mock.calls[0]![0]).toBeGreaterThanOrEqual(before + 25_000);
    expect(sockets[0]!.messages[0]).toMatchObject({
      total: 5,
      regions: [{ key: "EU", viewers: 5 }],
    });
    expect([...data.keys()]).toEqual(["regional-snapshot-v2"]);
    sockets.push(new Socket());
    expect(sockets[0]!.messages).toHaveLength(1);
  });
  it("withdraws a contribution immediately without publishing a new arrival", async () => {
    const sockets = Array.from({ length: 5 }, () => new Socket());
    const { object } = await fixture(sockets);
    await object.alarm();
    sockets.push(new Socket({ version: 2, region: "AS" }));
    await object.webSocketMessage(sockets[0] as unknown as WebSocket, "hide");
    expect(sockets[0]!.attachment).toEqual({ version: 2, region: null });
    expect(sockets[1]!.messages.at(-1)).toEqual({
      type: "snapshot",
      ready: true,
      total: 5,
      regions: [],
    });
  });
  it("removes aggregates and alarms after the last connection closes", async () => {
    const socket = new Socket();
    const { object, storage, data } = await fixture([socket]);
    await object.alarm();
    socket.close();
    await object.webSocketClose(socket as unknown as WebSocket);
    expect(storage.deleteAlarm).toHaveBeenCalledOnce();
    expect(data.size).toBe(0);
    const scheduled = storage.setAlarm.mock.calls.length;
    await object.alarm();
    expect(storage.setAlarm).toHaveBeenCalledTimes(scheduled);
  });
  it("scrubs legacy city attachments and rejects forged client messages", async () => {
    const old = new Socket({ city: "Bucharest", timezone: "Europe/Bucharest", latitude: 44.5 });
    const current = new Socket();
    const { object } = await fixture([old, current]);
    expect(old.attachment).toEqual({ version: 2, region: null });
    expect(old.readyState).toBe(3);
    await object.webSocketMessage(
      current as unknown as WebSocket,
      JSON.stringify({ region: "AS" }),
    );
    expect(current.readyState).toBe(3);
  });
});
