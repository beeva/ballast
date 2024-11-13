import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/lib/db/queries";
import { EditServiceForm } from "./edit-service-form";

export default async function EditServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl text-iron-50">Edit {service.name}</h1>
      <p className="mt-1 font-mono text-sm text-iron-400">{service.slug}</p>
      <EditServiceForm service={service} />
    </div>
  );
}
