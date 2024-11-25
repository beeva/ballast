export interface AlertWebhookPayload {
  event: "fired" | "resolved" | "test";
  ruleId: string;
  serviceId: string;
  metricName: string;
  comparator: string;
  threshold: number;
  currentValue: number;
  occurredAt: string;
}

export type WebhookSendResult = { ok: true } | { ok: false; error: string };

/**
 * POSTs a real JSON payload to a rule's configured webhook. Never throws -
 * a webhook receiver being down or slow is an external-system problem, not
 * a reason to break the alert evaluation loop that every other rule
 * depends on running to completion. Still returns a result rather than
 * void: evaluateAlertRule's fire/resolve path ignores it (fire-and-forget
 * is correct there), but the admin "Test webhook" button needs to tell the
 * admin whether the request actually succeeded.
 */
export async function sendAlertWebhook(url: string, payload: AlertWebhookPayload): Promise<WebhookSendResult> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      const error = `Webhook responded with ${response.status}`;
      console.error(`Alert webhook to ${url} returned ${response.status}`);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Request failed";
    console.error(`Alert webhook to ${url} failed:`, error);
    return { ok: false, error };
  }
}
