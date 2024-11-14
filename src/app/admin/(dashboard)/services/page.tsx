import Link from "next/link";
import { listServicesWithActiveDeploy } from "@/lib/db/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { triggerBuild } from "./actions";

export default async function AdminServicesPage() {
  const serviceRows = await listServicesWithActiveDeploy();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-iron-50">Services</h1>
          <p className="mt-1 text-sm text-iron-400">{serviceRows.length} declared.</p>
        </div>
        <Link href="/admin/services/new">
          <Button size="sm">New service</Button>
        </Link>
      </div>

      {serviceRows.length === 0 ? (
        <p className="py-8 text-center text-sm text-iron-400">No services yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-iron-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-iron-800 bg-iron-900/60 text-xs uppercase tracking-wide text-iron-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Live build</th>
                <th className="px-4 py-3 font-medium">Est. monthly cost</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-iron-800">
              {serviceRows.map((service) => (
                <tr key={service.id} className="transition-colors hover:bg-iron-900/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/services/${service.slug}`} className="text-copper-400 hover:underline">
                      {service.name}
                    </Link>
                    <p className="font-mono text-xs text-iron-500">{service.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    {service.activeDeploy ? (
                      <Badge tone="moss">deployed</Badge>
                    ) : (
                      <Badge tone="neutral">no active deploy</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-iron-100">${service.monthlyCost.totalUsd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={triggerBuild.bind(null, service.id)}>
                      <Button size="sm" variant="outline" type="submit">
                        Trigger build
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
