import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getServiceHealthSummary } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status",
  description: "Live service health, derived from currently firing alert rules.",
};

export default async function StatusPage() {
  const services = await getServiceHealthSummary();
  const degradedCount = services.filter((s) => s.firingAlertCount > 0).length;
  const allHealthy = services.length > 0 && degradedCount === 0;

  return (
    <>
      <Navbar />
      <main className="container-page py-16">
        <h1 className="font-display text-3xl text-iron-50">System status</h1>
        <p className="mt-3 max-w-2xl text-iron-300">
          Derived live from currently firing alert rules - not a hand-maintained page, so it
          can&apos;t say &quot;operational&quot; while something&apos;s actually on fire.
        </p>

        <Card className="mt-8">
          {services.length === 0 ? (
            <p className="text-sm text-iron-400">No services configured yet.</p>
          ) : (
            <div className="flex items-center gap-3">
              <Badge tone={allHealthy ? "moss" : "danger"}>
                {allHealthy ? "All systems operational" : `${degradedCount} service${degradedCount === 1 ? "" : "s"} degraded`}
              </Badge>
            </div>
          )}
        </Card>

        {services.length > 0 && (
          <Card className="mt-4">
            <CardTitle>Services</CardTitle>
            <ul className="mt-4 flex flex-col gap-3">
              {services.map((service) => (
                <li
                  key={service.id}
                  className="flex items-center justify-between border-b border-iron-800 pb-3 text-sm last:border-0"
                >
                  <span className="text-iron-100">{service.name}</span>
                  {service.firingAlertCount > 0 ? (
                    <Badge tone="danger">
                      {service.firingAlertCount} alert{service.firingAlertCount === 1 ? "" : "s"} firing
                    </Badge>
                  ) : (
                    <Badge tone="moss">operational</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
      <Footer />
    </>
  );
}
