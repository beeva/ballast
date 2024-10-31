"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const from = useSearchParams().get("from") ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-lg text-iron-50">
          Ballast
        </Link>
        <h1 className="mt-6 font-display text-2xl text-iron-50">Admin sign in</h1>
        <p className="mt-1 text-sm text-iron-400">Manage services, deploys, and alerts.</p>

        <form action={formAction} className="mt-8 space-y-4">
          <input type="hidden" name="from" value={from} />
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm text-iron-300">
              Email
            </label>
            <Input id="email" name="email" type="email" required autoComplete="username" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm text-iron-300">
              Password
            </label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-red-400">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}
