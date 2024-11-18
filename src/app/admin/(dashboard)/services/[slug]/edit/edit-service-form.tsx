"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { getServiceBySlug } from "@/lib/db/queries";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { formatEnvVarsText } from "@/lib/services/env-vars";
import { updateService, type ActionState } from "../../actions";

type Service = NonNullable<Awaited<ReturnType<typeof getServiceBySlug>>>;

const initialState: ActionState = {};

export function EditServiceForm({ service }: { service: Service }) {
  const boundUpdateService = updateService.bind(null, service.id, service.slug);
  const [state, formAction, pending] = useActionState(boundUpdateService, initialState);
  const router = useRouter();

  useEffect(() => {
    if (!pending && !state.error && state !== initialState) {
      router.push(`/admin/services/${service.slug}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the action's result changes
  }, [state, pending]);

  return (
    <Card className="mt-6">
      <CardTitle>Details</CardTitle>
      <CardDescription className="mb-4">
        Name and slug aren&apos;t editable here - they&apos;re how builds and deploys reference this service.
      </CardDescription>

      <form action={formAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-iron-300">
          Repo URL
          <Input name="repoUrl" defaultValue={service.repoUrl} required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-iron-300">
          Working directory
          <Input name="workingDirectory" defaultValue={service.workingDirectory} required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-iron-300">
          Build command
          <Input name="buildCommand" defaultValue={service.buildCommand} required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-iron-300">
          Start command
          <Input name="startCommand" defaultValue={service.startCommand} required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-iron-300">
          Env vars <span className="text-iron-500">(optional, one KEY=VALUE per line)</span>
          <Textarea name="envVars" defaultValue={formatEnvVarsText(service.envVars)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm text-iron-300">
            CPU request (millicores)
            <Input name="cpuRequestMilli" type="number" defaultValue={service.cpuRequestMilli} required />
          </label>
          <label className="flex flex-col gap-1 text-sm text-iron-300">
            Memory request (MB)
            <Input name="memoryRequestMb" type="number" defaultValue={service.memoryRequestMb} required />
          </label>
        </div>

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
