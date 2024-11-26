"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { getAlertRuleById } from "@/lib/db/queries";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateAlertRule, type ActionState } from "../../actions";

type Rule = NonNullable<Awaited<ReturnType<typeof getAlertRuleById>>>;

const initialState: ActionState = {};

const selectClasses =
  "rounded-lg border border-iron-700 bg-iron-900 px-3 py-2 text-sm text-iron-100 outline-none focus:border-copper-500 focus:ring-1 focus:ring-copper-500";

export function EditAlertRuleForm({ rule }: { rule: Rule }) {
  const boundUpdateAlertRule = updateAlertRule.bind(null, rule.id);
  const [state, formAction, pending] = useActionState(boundUpdateAlertRule, initialState);
  const router = useRouter();

  useEffect(() => {
    if (!pending && !state.error && state !== initialState) {
      router.push("/admin/alerts");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the action's result changes
  }, [state, pending]);

  return (
    <Card className="mt-6">
      <CardTitle>Details</CardTitle>
      <form action={formAction} className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-iron-300">
          Metric name
          <Input name="metricName" defaultValue={rule.metricName} required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-iron-300">
          Comparator
          <select name="comparator" required className={selectClasses} defaultValue={rule.comparator}>
            <option value="gt">Greater than</option>
            <option value="gte">Greater than or equal</option>
            <option value="lt">Less than</option>
            <option value="lte">Less than or equal</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-iron-300">
          Threshold
          <Input name="threshold" type="number" step="any" defaultValue={Number(rule.threshold)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-iron-300">
          Window (minutes)
          <Input name="windowMinutes" type="number" defaultValue={rule.windowMinutes} required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-iron-300">
          Webhook URL <span className="text-iron-500">(optional)</span>
          <Input name="webhookUrl" type="url" defaultValue={rule.webhookUrl ?? ""} placeholder="https://example.com/hooks/ballast" />
        </label>

        {state.error && (
          <p role="alert" className="text-sm text-red-400">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="mt-1">
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Card>
  );
}
