/** @file Coordinates regional WebSocket presence with batched counts, immediate withdrawal, and temporary aggregates. */

import { DurableObject } from "cloudflare:workers";
import {
  isPresenceAttachment,
  PRESENCE_INTERVAL,
  regionCode,
  regionSnapshot,
  withdrawSnapshot,
  type PresenceAttachment,
  type PresenceMessage,
  type PresenceSnapshot,
} from "./regions";

/**
 * GlobePresence Durable Object.
 *
 * Coordinates live interactive globe presence using Cloudflare Workers WebSocket Hibernation API:
 * - Maintains active WebSocket connections without incurring CPU cost while idle.
 * - Stores coarse regional presence in connection attachments (`deserializeAttachment`).
 * - Employs differential privacy & batching: presence is only broadcast in aggregated snapshots
 *   every `PRESENCE_INTERVAL` (25s) using Durable Object alarms.
 * - Prevents tracking individuals: visitor counts are binned to minimum thresholds (5+),
 *   and individual connection arrivals are never immediately revealed.
 */
export class GlobePresence extends DurableObject {
  private published: PresenceSnapshot = { type: "snapshot", ready: false, total: 0, regions: [] };

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Automatically answer client ping heartbeats at the edge without waking the DO
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));

    // Block concurrency while recovering state or migrating old schemas
    void ctx.blockConcurrencyWhile(async () => {
      this.published =
        (await ctx.storage.get<PresenceSnapshot>("regional-snapshot-v2")) ?? this.published;

      // Cleanly retire legacy city-based connections on upgrade
      for (const socket of ctx.getWebSockets()) {
        if (!isPresenceAttachment(socket.deserializeAttachment())) {
          socket.serializeAttachment({ version: 2, region: null } satisfies PresenceAttachment);
          socket.close(1012, "Reload for regional privacy controls");
        }
      }
    });
  }

  private sockets(exclude?: WebSocket) {
    return this.ctx
      .getWebSockets()
      .filter((socket) => socket !== exclude && socket.readyState === 1);
  }
  private snapshot(exclude?: WebSocket) {
    return regionSnapshot(
      this.sockets(exclude).map((socket) => {
        const attachment: unknown = socket.deserializeAttachment();
        return isPresenceAttachment(attachment) ? attachment : { version: 2, region: null };
      }),
    );
  }
  // Send a JSON message to a connected socket, handling disconnection gracefully
  private send(socket: WebSocket, message: PresenceMessage) {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      socket.close(1011, "Connection lost");
    }
  }

  // Ensure an alarm is scheduled to batch-publish presence updates every 25s
  private async schedule() {
    if ((await this.ctx.storage.getAlarm()) === null)
      await this.ctx.storage.setAlarm(Date.now() + PRESENCE_INTERVAL);
  }

  // Persist current snapshot in Durable Object storage and broadcast to all connected clients
  private async publish(snapshot: PresenceSnapshot) {
    this.published = snapshot;
    await this.ctx.storage.put("regional-snapshot-v2", snapshot);
    for (const socket of this.sockets()) this.send(socket, snapshot);
  }

  /**
   * Handle incoming WebSocket upgrade request.
   * Accepts connection, attaches viewer region code, and returns the welcome message.
   */
  override async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
      return new Response("WebSocket required", { status: 426 });
    if (this.sockets().length >= 5000) return new Response("Presence is busy", { status: 503 });
    const region = regionCode(request.headers.get("X-Viewer-Region"));
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ version: 2, region } satisfies PresenceAttachment);
    this.send(pair[1], { type: "welcome", sharing: region !== null });
    // New connections receive only the last batch, not a fresh arrival count.
    this.send(pair[1], this.published);
    await this.schedule();
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  /**
   * Durable Object Alarm handler.
   * Runs periodically (every 25 seconds) to compute a privacy-preserving aggregated snapshot
   * and broadcast it to all active sockets.
   */
  override async alarm() {
    const sockets = this.sockets();
    if (!sockets.length) {
      this.published = { type: "snapshot", ready: false, total: 0, regions: [] };
      await this.ctx.storage.delete("regional-snapshot-v2");
      return;
    }
    await this.publish(this.snapshot());
    await this.ctx.storage.setAlarm(Date.now() + PRESENCE_INTERVAL);
  }

  // Clean up when a socket disconnects, deleting alarm when no viewers remain
  private async disconnected(socket: WebSocket) {
    if (!this.sockets(socket).length) {
      await this.ctx.storage.deleteAlarm();
      await this.ctx.storage.delete("regional-snapshot-v2");
      this.published = { type: "snapshot", ready: false, total: 0, regions: [] };
    } else await this.schedule();
  }

  override async webSocketClose(socket: WebSocket) {
    await this.disconnected(socket);
  }
  override async webSocketError(socket: WebSocket) {
    socket.close(1011, "Connection lost");
    await this.disconnected(socket);
  }
  override async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer) {
    if (message === "hide") {
      socket.serializeAttachment({ version: 2, region: null } satisfies PresenceAttachment);
      this.send(socket, { type: "welcome", sharing: false });
      // Apply withdrawal immediately, while keeping other additions batched.
      await this.publish(withdrawSnapshot(this.published, this.snapshot()));
      return;
    }
    socket.close(1008, "Unsupported message");
    await this.disconnected(socket);
  }
}
