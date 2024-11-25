"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { testAlertWebhook, type TestWebhookState } from "./actions";

const initialState: TestWebhookState = {};

export function TestWebhookButton({ ruleId }: { ruleId: string }) {
  const boundAction = testAlertWebhook.bind(null, ruleId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <Button size="sm" variant="outline" type="submit" disabled={pending}>
        {pending ? "Testing..." : "Test webhook"}
      </Button>
      {state.result && (
        <span role="status" className={`text-xs ${state.result === "success" ? "text-moss-400" : "text-red-400"}`}>
          {state.result === "success" ? "✓" : "✗"} {state.message}
        </span>
      )}
    </form>
  );
}
