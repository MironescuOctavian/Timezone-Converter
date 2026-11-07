import { DurableObject } from "cloudflare:workers";

// One named object serializes the shared total; no conversion inputs are stored.
export class ConversionCounter extends DurableObject {
  override async fetch(request: Request): Promise<Response> {
    if (request.method === "GET")
      return Response.json({ total: (await this.ctx.storage.get<number>("total")) ?? 0 });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const total = await this.ctx.storage.transaction(async (transaction) => {
      const next = ((await transaction.get<number>("total")) ?? 0) + 1;
      await transaction.put("total", next);
      return next;
    });
    return Response.json({ total });
  }
}
