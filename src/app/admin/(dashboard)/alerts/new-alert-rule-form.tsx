"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAlertRule, type ActionState } from "./actions";

const initialState: ActionState = {};

const selectClasses =
  "rounded-lg border border-iron-700 bg-iron-900 px-3 py-2 text-sm text-iron-100 outline-none focus:border-copper-500 focus:ring-1 focus:ring-copper-500";

export function NewAlertRuleForm({ services }: { services: Array<{ id: string; name: string }> }) {
  const [state, formAction, pending] = useActionState(createAlertRule, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-iron-300">
        Service
        <select name="serviceId" required className={selectClasses}>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-iron-300">
        Metric name
        <Input name="metricName" placeholder="error_rate" required />
      </label>
      <label className="flex flex-col gap-1 text-sm text-iron-300">
        Comparator
        <select name="comparator" required className={selectClasses} defaultValue="gt">
          <option value="gt">Greater than</option>
          <option value="gte">Greater than or equal</option>
          <option value="lt">Less than</option>
          <option value="lte">Less than or equal</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-iron-300">
        Threshold
        <Input name="threshold" type="number" step="any" required />
      </label>
      <label className="flex flex-col gap-1 text-sm text-iron-300">
        Window (minutes)
        <Input name="windowMinutes" type="number" defaultValue={5} required />
      </label>
      <label className="flex flex-col gap-1 text-sm text-iron-300">
        Webhook URL <span className="text-iron-500">(optional)</span>
        <Input name="webhookUrl" type="url" placeholder="https://example.com/hooks/ballast" />
      </label>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <Button type="submit" className="mt-1" disabled={pending || services.length === 0}>
        {services.length === 0 ? "Create a service first" : pending ? "Adding..." : "Add rule"}
      </Button>
    </form>
  );
}
