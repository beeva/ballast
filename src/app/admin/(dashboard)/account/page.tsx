import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";

export default async function AccountPage() {
  const admin = await getCurrentAdmin();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl text-iron-50">Account</h1>
      <p className="mt-1 text-sm text-iron-400">{admin?.email}</p>

      <Card className="mt-6">
        <CardTitle>Change password</CardTitle>
        <CardDescription className="mb-4">Takes effect immediately - this session stays signed in.</CardDescription>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
