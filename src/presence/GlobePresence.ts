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

// Per-connection attachments contain only an optional broad region. The single
// stored snapshot is an overwritten aggregate, never a visit/event history.
export class GlobePresence extends DurableObject {
  private published: PresenceSnapshot = { type: "snapshot", ready: false, total: 0, regions: [] };
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
    void ctx.blockConcurrencyWhile(async () => {
      this.published =
        (await ctx.storage.get<PresenceSnapshot>("regional-snapshot-v2")) ?? this.published;
      // Retire old city-based connections on upgrade, including their attachments.
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
  private send(socket: WebSocket, message: PresenceMessage) {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      socket.close(1011, "Connection lost");
    }
  }
  private async schedule() {
    if ((await this.ctx.storage.getAlarm()) === null)
      await this.ctx.storage.setAlarm(Date.now() + PRESENCE_INTERVAL);
  }
  private async publish(snapshot: PresenceSnapshot) {
    this.published = snapshot;
    await this.ctx.storage.put("regional-snapshot-v2", snapshot);
    for (const socket of this.sockets()) this.send(socket, snapshot);
  }
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
