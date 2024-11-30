import type { Metadata } from "next";
import { getServiceBySlug } from "@/lib/db/queries";
import { formatEnvVarsText } from "@/lib/services/env-vars";
import { NewServiceForm, type NewServiceInitialValues } from "./new-service-form";

export const metadata: Metadata = { title: "New service" };

export default async function NewServicePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const source = from ? await getServiceBySlug(from) : null;

  const initialValues: NewServiceInitialValues | undefined = source
    ? {
        repoUrl: source.repoUrl,
        workingDirectory: source.workingDirectory,
        buildCommand: source.buildCommand,
        startCommand: source.startCommand,
        envVarsText: formatEnvVarsText(source.envVars),
        cpuRequestMilli: source.cpuRequestMilli,
        memoryRequestMb: source.memoryRequestMb,
        sourceName: source.name,
      }
    : undefined;

  return <NewServiceForm initialValues={initialValues} />;
}
