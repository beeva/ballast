"use client";

import { Button } from "@/components/ui/button";
import { deleteService } from "../actions";

/**
 * Deleting a service cascades to every build, deploy, metric, and alert
 * rule it owns - destructive and hard to reverse, so this is the one
 * action in the admin UI that confirms before submitting.
 */
export function DeleteServiceButton({ serviceId, serviceName }: { serviceId: string; serviceName: string }) {
  return (
    <form
      action={deleteService.bind(null, serviceId)}
      onSubmit={(e) => {
        if (!confirm(`Delete "${serviceName}"? This removes its full build/deploy history and can't be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="outline" className="border-red-500/40 text-red-400 hover:border-red-400 hover:text-red-300">
        Delete service
      </Button>
    </form>
  );
}
