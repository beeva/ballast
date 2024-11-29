"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePassword, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-iron-300">
        Current password
        <Input name="currentPassword" type="password" autoComplete="current-password" required />
      </label>
      <label className="flex flex-col gap-1 text-sm text-iron-300">
        New password
        <Input name="newPassword" type="password" autoComplete="new-password" required minLength={8} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-iron-300">
        Confirm new password
        <Input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm text-moss-400">
          Password changed.
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Changing..." : "Change password"}
      </Button>
    </form>
  );
}
