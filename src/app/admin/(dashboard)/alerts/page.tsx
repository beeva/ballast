import type { Metadata } from "next";
import Link from "next/link";
import { listAlertRulesWithStatus, listServices } from "@/lib/db/queries";
import { filterAlertRulesByQuery } from "@/lib/alerts/search";
import { formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NewAlertRuleForm } from "./new-alert-rule-form";
import { TestWebhookButton } from "./test-webhook-button";
import { deleteAlertRule } from "./actions";

export const metadata: Metadata = { title: "Alerts" };

const COMPARATOR_LABEL: Record<string, string> = {
  gt: "is above",
  gte: "is at or above",
  lt: "is below",
  lte: "is at or below",
};

export default async function AdminAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const [allRules, allServices] = await Promise.all([listAlertRulesWithStatus(), listServices()]);
  const rules = filterAlertRulesByQuery(allRules, q);
  const firingCount = allRules.filter((r) => r.firingEvent).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-iron-50">Alerts</h1>
        <p className="mt-1 text-sm text-iron-400">
          {allRules.length} rule{allRules.length === 1 ? "" : "s"}, {firingCount} currently firing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-3">
          {allRules.length > 0 && (
            <form className="max-w-sm">
              <Input type="search" name="q" placeholder="Search by service or metric..." defaultValue={q} />
            </form>
          )}
          {allRules.length === 0 ? (
            <p className="py-8 text-center text-sm text-iron-400">No alert rules yet.</p>
          ) : rules.length === 0 ? (
            <p className="py-8 text-center text-sm text-iron-400">No rules match &quot;{q}&quot;.</p>
          ) : (
            rules.map((rule) => (
              <Card key={rule.id} className={rule.firingEvent ? "border-l-4 border-l-red-500/60" : undefined}>
                <div className="flex items-center justify-between">
                  <div>
                    <Link href={`/admin/services/${rule.serviceSlug}`} className="text-copper-400 hover:underline">
                      {rule.serviceName}
                    </Link>
                    <p className="mt-1 text-sm text-iron-200">
                      {rule.metricName} {COMPARATOR_LABEL[rule.comparator] ?? rule.comparator}{" "}
                      <span className="font-mono">{Number(rule.threshold)}</span>, averaged over{" "}
                      {rule.windowMinutes}m
                    </p>
                    {rule.webhookUrl && (
                      <p className="mt-1 text-xs text-iron-500">notifies {rule.webhookUrl}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {rule.firingEvent ? (
                      <div className="text-right">
                        <Badge tone="danger">firing</Badge>
                        <p className="mt-1 text-xs text-iron-500">
                          since {formatRelativeTime(rule.firingEvent.triggeredAt)}
                        </p>
                      </div>
                    ) : (
                      <Badge tone="moss">healthy</Badge>
                    )}
                    <LinkButton href={`/admin/alerts/${rule.id}/edit`} size="sm" variant="outline">
                      Edit
                    </LinkButton>
                    <form action={deleteAlertRule.bind(null, rule.id)}>
                      <Button size="sm" variant="outline" type="submit">
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
                {rule.webhookUrl && (
                  <div className="mt-3 border-t border-iron-800 pt-3">
                    <TestWebhookButton ruleId={rule.id} />
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardTitle>New alert rule</CardTitle>
          <CardDescription className="mb-4">Evaluated by the alert-check worker.</CardDescription>
          <NewAlertRuleForm services={allServices} />
        </Card>
      </div>
    </div>
  );
}
