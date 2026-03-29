import crypto from "crypto";

import { db } from "@/lib/db";

export async function fireWebhooks(
  portfolioId: string,
  event: string,
  data: Record<string, unknown>,
) {
  const webhooks = await db.formWebhook.findMany({
    where: { portfolioId, isActive: true, events: { has: event } },
  });

  const payload = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data,
  });

  for (const webhook of webhooks) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (webhook.secret) {
      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(payload)
        .digest("hex");
      headers["X-Webhook-Signature"] = `sha256=${signature}`;
    }

    fetch(webhook.url, {
      method: "POST",
      headers,
      body: payload,
      signal: AbortSignal.timeout(5000),
    }).catch(() => {});
  }
}
