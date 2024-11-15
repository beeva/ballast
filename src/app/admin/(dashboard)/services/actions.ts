"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
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

const updateServiceSchema = createServiceSchema.omit({ name: true, slug: true });

/**
 * name and slug aren't editable here - slug is how builds/deploys and the
 * public URL path both reference a service, so renaming it would either
 * break existing links or require a migration step this form doesn't do.
 * Renaming would need its own deliberate flow, not a field on this one.
 */
export async function updateService(
  serviceId: string,
  serviceSlug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = updateServiceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await db
    .update(services)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(services.id, serviceId));

  revalidatePath(`/admin/services/${serviceSlug}`);
  return {};
}

/**
 * Cascades to the service's builds, deploys, metrics, and alert rules per
 * the schema's declared ON DELETE CASCADE - verified directly against a
 * real database that this doesn't trip the separate ON DELETE RESTRICT on
 * deploys.buildId, since the referencing deploy row is removed in the same
 * cascading delete, not left dangling.
 */
export async function deleteService(serviceId: string): Promise<void> {
  await requireAdmin();
  await db.delete(services).where(eq(services.id, serviceId));
  revalidatePath("/admin/services");
  redirect("/admin/services");
}

export async function triggerBuild(serviceId: string): Promise<void> {
  await requireAdmin();
  await db.insert(builds).values({ serviceId, status: "queued" });
  revalidatePath(`/admin/services`);
}

/**
 * Only a queued build can be cancelled this way - a running build's
 * subprocess is owned by the separate worker process (scripts/run-worker.ts),
 * which this web request has no channel to signal, so "cancelling" it would
 * just be a UI lie unless the worker cooperatively polled for it mid-build,
 * which it doesn't. The status='queued' guard in the WHERE clause means a
 * build the worker has already claimed (now 'running') is left alone rather
 * than corrupted into a false "cancelled" state.
 */
export async function cancelQueuedBuild(buildId: string): Promise<void> {
  await requireAdmin();
  await db
    .update(builds)
    .set({ status: "failed", errorMessage: "cancelled before it started", finishedAt: new Date() })
    .where(and(eq(builds.id, buildId), eq(builds.status, "queued")));
  revalidatePath("/admin/services");
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
