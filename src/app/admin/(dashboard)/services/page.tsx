import Link from "next/link";
import { listServicesWithActiveDeploy } from "@/lib/db/queries";
import { filterServicesByQuery } from "@/lib/services/search";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { triggerBuild } from "./actions";

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const allServices = await listServicesWithActiveDeploy();
  const serviceRows = filterServicesByQuery(allServices, q);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-iron-50">Services</h1>
          <p className="mt-1 text-sm text-iron-400">
            {serviceRows.length} of {allServices.length} shown.
          </p>
        </div>
        <LinkButton href="/admin/services/new" size="sm">
          New service
        </LinkButton>
      </div>

      {allServices.length > 0 && (
        <form className="max-w-sm">
          <Input type="search" name="q" placeholder="Search by name or slug..." defaultValue={q} />
        </form>
      )}

      {allServices.length === 0 ? (
        <p className="py-8 text-center text-sm text-iron-400">No services yet.</p>
      ) : serviceRows.length === 0 ? (
        <p className="py-8 text-center text-sm text-iron-400">No services match &quot;{q}&quot;.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-iron-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-iron-800 bg-iron-900/60 text-xs uppercase tracking-wide text-iron-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Live build</th>
                <th scope="col" className="px-4 py-3 font-medium">Alerts</th>
                <th scope="col" className="px-4 py-3 font-medium">Est. monthly cost</th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
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
                  <td className="px-4 py-3">
                    {service.firingAlertCount > 0 ? (
                      <Badge tone="danger">{service.firingAlertCount} firing</Badge>
                    ) : (
                      <span className="text-xs text-iron-500">&mdash;</span>
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
