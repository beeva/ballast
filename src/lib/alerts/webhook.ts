export interface AlertWebhookPayload {
  event: "fired" | "resolved";
  ruleId: string;
  serviceId: string;
  metricName: string;
  comparator: string;
  threshold: number;
  currentValue: number;
  occurredAt: string;
}

/**
 * POSTs a real JSON payload to a rule's configured webhook. Failures are
 * caught and logged, never thrown - a webhook receiver being down or slow
 * is an external-system problem, not a reason to break the alert
 * evaluation loop that every other rule depends on running to completion.
 */
export async function sendAlertWebhook(url: string, payload: AlertWebhookPayload): Promise<void> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.error(`Alert webhook to ${url} returned ${response.status}`);
    }
  } catch (err) {
    console.error(`Alert webhook to ${url} failed:`, err instanceof Error ? err.message : err);
  }
}
