"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { createService, type ActionState } from "../actions";

const initialState: ActionState = {};

export interface NewServiceInitialValues {
  repoUrl: string;
  workingDirectory: string;
  buildCommand: string;
  startCommand: string;
  envVarsText: string;
  cpuRequestMilli: number;
  memoryRequestMb: number;
  sourceName: string;
}

export function NewServiceForm({ initialValues }: { initialValues?: NewServiceInitialValues }) {
  const [state, formAction, pending] = useActionState(createService, initialState);
  const router = useRouter();

  useEffect(() => {
    if (!pending && !state.error && state !== initialState) {
      router.push("/admin/services");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the action's result changes
  }, [state, pending]);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl text-iron-50">New service</h1>
      <p className="mt-1 text-sm text-iron-400">
        {initialValues
          ? `Prefilled from ${initialValues.sourceName} - name and slug still need to be your own, everything else can stay as-is.`
          : "repoUrl can be a remote git URL or a local path `git clone` can reach."}
      </p>

      <Card className="mt-6">
        <CardTitle>Details</CardTitle>
        <CardDescription className="mb-4">Every field maps directly to a build/deploy setting.</CardDescription>

        <form action={formAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-iron-300">
            Name
            <Input name="name" placeholder="Checkout API" required />
          </label>
          <label className="flex flex-col gap-1 text-sm text-iron-300">
            Slug
            <Input name="slug" placeholder="checkout-api" required />
          </label>
          <label className="flex flex-col gap-1 text-sm text-iron-300">
            Repo URL
            <Input
              name="repoUrl"
              placeholder="https://github.com/org/repo.git"
              defaultValue={initialValues?.repoUrl}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-iron-300">
            Working directory
            <Input name="workingDirectory" defaultValue={initialValues?.workingDirectory ?? "."} required />
          </label>
          <label className="flex flex-col gap-1 text-sm text-iron-300">
            Build command
            <Input
              name="buildCommand"
              placeholder="npm run build"
              defaultValue={initialValues?.buildCommand}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-iron-300">
            Start command
            <Input
              name="startCommand"
              placeholder="npm start"
              defaultValue={initialValues?.startCommand}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-iron-300">
            Env vars <span className="text-iron-500">(optional, one KEY=VALUE per line)</span>
            <Textarea
              name="envVars"
              placeholder={"NODE_ENV=production\nAPI_BASE_URL=https://api.example.com"}
              defaultValue={initialValues?.envVarsText}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-iron-300">
              CPU request (millicores)
              <Input
                name="cpuRequestMilli"
                type="number"
                defaultValue={initialValues?.cpuRequestMilli ?? 250}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-iron-300">
              Memory request (MB)
              <Input
                name="memoryRequestMb"
                type="number"
                defaultValue={initialValues?.memoryRequestMb ?? 512}
                required
              />
            </label>
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-red-400">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Creating..." : "Create service"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
