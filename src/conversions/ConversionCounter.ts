import { DurableObject } from "cloudflare:workers";

/**
 * ConversionCounter Durable Object.
 *
 * Provides a strongly consistent, globally shared distributed counter for total timezone conversions.
 * Guarantees atomic increments via transactional storage without storing individual visitor IP addresses
 * or conversion inputs, adhering to privacy-by-design principles.
 */
export class ConversionCounter extends DurableObject {
  override async fetch(request: Request): Promise<Response> {
    // GET: Retrieve the current lifetime conversion count
    if (request.method === "GET")
      return Response.json({ total: (await this.ctx.storage.get<number>("total")) ?? 0 });

    // Only GET and POST methods are permitted
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

    // POST: Atomically increment and persist the total in transactional storage
    const total = await this.ctx.storage.transaction(async (transaction) => {
      const next = ((await transaction.get<number>("total")) ?? 0) + 1;
      await transaction.put("total", next);
      return next;
    });

    return Response.json({ total });
  }
}

