import { notFound } from "next/navigation";
import { getAlertRuleById } from "@/lib/db/queries";
import { EditAlertRuleForm } from "./edit-alert-rule-form";

export default async function EditAlertRulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rule = await getAlertRuleById(id);
  if (!rule) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl text-iron-50">Edit alert rule</h1>
      <p className="mt-1 text-sm text-iron-400">{rule.serviceName}</p>
      <EditAlertRuleForm rule={rule} />
    </div>
  );
}
