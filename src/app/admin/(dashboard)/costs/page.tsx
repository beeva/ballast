import type { Metadata } from "next";
import Link from "next/link";
import { listServices } from "@/lib/db/queries";
import { estimateFleetMonthlyCost, estimateMonthlyCost } from "@/lib/cost/estimate";
import { Card, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Costs" };

export default async function CostsPage() {
  const services = await listServices();
  const fleetCost = estimateFleetMonthlyCost(services);

  const breakdown = services
    .map((service) => ({
      service,
      cost: estimateMonthlyCost(service.cpuRequestMilli, service.memoryRequestMb),
    }))
    .sort((a, b) => b.cost.totalUsd - a.cost.totalUsd);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-iron-50">Cost breakdown</h1>
        <p className="mt-1 text-sm text-iron-400">
          Estimated from declared resource requests, not measured usage - this project has no
          real scheduler to measure against. Ballpark serverless-container pricing, not a live
          pricing API.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-iron-400">CPU</p>
          <p className="mt-2 font-display text-2xl text-iron-50">${fleetCost.cpuCostUsd.toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-sm text-iron-400">Memory</p>
          <p className="mt-2 font-display text-2xl text-iron-50">${fleetCost.memoryCostUsd.toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-sm text-iron-400">Fleet total / mo</p>
          <p className="mt-2 font-display text-2xl text-copper-400">${fleetCost.totalUsd.toFixed(2)}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>Per service</CardTitle>
        {breakdown.length === 0 ? (
          <p className="mt-3 text-sm text-iron-400">No services yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-iron-800 text-xs uppercase tracking-wide text-iron-400">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-medium">Service</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Request</th>
                  <th scope="col" className="py-2 pr-4 font-medium">CPU / mo</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Memory / mo</th>
                  <th scope="col" className="py-2 font-medium">Total / mo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron-800">
                {breakdown.map(({ service, cost }) => (
                  <tr key={service.id}>
                    <td className="py-2.5 pr-4">
                      <Link href={`/admin/services/${service.slug}`} className="text-copper-400 hover:underline">
                        {service.name}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-iron-400">
                      {(service.cpuRequestMilli / 1000).toFixed(2)} vCPU · {service.memoryRequestMb} MB
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-iron-100">${cost.cpuCostUsd.toFixed(2)}</td>
                    <td className="py-2.5 pr-4 font-mono text-iron-100">${cost.memoryCostUsd.toFixed(2)}</td>
                    <td className="py-2.5 font-mono text-iron-50">${cost.totalUsd.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
