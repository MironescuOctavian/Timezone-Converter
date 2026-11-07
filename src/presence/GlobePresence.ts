import { DurableObject } from "cloudflare:workers";
import { groupViewers, type PresenceMessage, type ViewerLocation } from "./shared";

// Adapted from Cloudflare's multiplayer-globe-template architecture.
// Connection attachments survive hibernation; nothing is written to application storage.
export class GlobePresence extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  override fetch(request: Request): Response {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
      return new Response("WebSocket required", { status: 426 });
    if (this.ctx.getWebSockets().length >= 5000)
      return new Response("Presence is busy", { status: 503 });
    const location = JSON.parse(
      request.headers.get("X-Viewer-Location") ?? "null",
    ) as ViewerLocation | null;
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment(location);
    pair[1].send(JSON.stringify({ type: "welcome", location } satisfies PresenceMessage));
    this.broadcast();
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  private broadcast(exclude?: WebSocket) {
    const sockets = this.ctx
      .getWebSockets()
      .filter((socket) => socket !== exclude && socket.readyState === 1);
    const message = JSON.stringify({
      type: "snapshot",
      total: sockets.length,
      cities: groupViewers(
        sockets.map((socket) => socket.deserializeAttachment() as ViewerLocation | null),
      ),
    } satisfies PresenceMessage);
    for (const socket of sockets) {
      try {
        socket.send(message);
      } catch {
        socket.close(1011, "Connection lost");
      }
    }
  }

  override webSocketClose(socket: WebSocket) {
    this.broadcast(socket);
  }
  override webSocketError(socket: WebSocket) {
    socket.close(1011, "Connection lost");
    this.broadcast(socket);
  }
  override webSocketMessage(socket: WebSocket) {
    // The browser cannot publish a forged city or send arbitrary broadcasts.
    socket.close(1008, "Unsupported message");
    this.broadcast(socket);
  }
}
