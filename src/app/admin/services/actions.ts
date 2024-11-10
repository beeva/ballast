"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { builds, services } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/current-admin";
import { deployBuild } from "@/lib/deploys/deploy";

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const createServiceSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).regex(slugPattern, "Use lowercase letters, numbers, and hyphens only."),
  repoUrl: z.string().min(1).refine((v) => !v.startsWith("-"), {
    message: "Repo URL can't start with a hyphen.",
  }),
  buildCommand: z.string().min(1),
  startCommand: z.string().min(1),
  workingDirectory: z.string().min(1).default("."),
  cpuRequestMilli: z.coerce.number().int().min(50).max(16000),
  memoryRequestMb: z.coerce.number().int().min(64).max(65536),
});

export interface ActionState {
  error?: string;
}

export async function createService(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = createServiceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await db.insert(services).values(parsed.data);
  } catch (err) {
    if (err instanceof Error && err.message.includes("services_slug_unique")) {
      return { error: `A service with slug "${parsed.data.slug}" already exists.` };
    }
    throw err;
  }

  revalidatePath("/admin/services");
  return {};
}

export async function triggerBuild(serviceId: string): Promise<void> {
  await requireAdmin();
  await db.insert(builds).values({ serviceId, status: "queued" });
  revalidatePath(`/admin/services`);
}

/**
 * Bound directly to a plain `<form action={...}>`, so it must return void -
 * unlike createService, there's no useActionState hook here to hand an
 * ActionState back to. The failure paths (build not found/wrong service/
 * not successful) are all defensive: the UI only ever renders this action
 * behind a successful, not-yet-deployed build, so reaching one of them
 * means something raced or was tampered with, not a normal user mistake -
 * throwing and letting the nearest error boundary catch it is the right
 * amount of handling for that.
 */
export async function deployBuildAction(serviceId: string, buildId: string): Promise<void> {
  const admin = await requireAdmin();
  const result = await deployBuild(db, {
    serviceId,
    buildId,
    deployedBy: admin.email,
  });
  revalidatePath("/admin/services");
  if (!result.ok) throw new Error(result.error);
}
