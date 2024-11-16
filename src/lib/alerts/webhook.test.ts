import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendAlertWebhook } from "./webhook";

const payload = {
  event: "fired" as const,
  ruleId: "rule-1",
  serviceId: "svc-1",
  metricName: "latency_ms",
  comparator: "gt",
  threshold: 500,
  currentValue: 620,
  occurredAt: "2024-11-15T00:00:00.000Z",
};

describe("sendAlertWebhook", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs the JSON payload to the given URL", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    await sendAlertWebhook("https://example.com/hook", payload);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("fetch was not called");
    const [url, init] = call;
    expect(url).toBe("https://example.com/hook");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual(payload);
  });

  it("does not throw when the receiver responds with a non-2xx status", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(sendAlertWebhook("https://example.com/hook", payload)).resolves.toBeUndefined();
  });

  it("does not throw when the network request itself fails", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(sendAlertWebhook("https://example.com/hook", payload)).resolves.toBeUndefined();
  });
});
