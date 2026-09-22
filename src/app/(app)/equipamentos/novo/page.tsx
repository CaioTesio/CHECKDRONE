import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { NewEquipmentForm } from "./new-equipment-form";

export default async function NewEquipmentPage() {
  await requirePermission("equipment:create");

  return (
    <>
      <PageHeader
        title="Novo Equipamento"
        description="Registre um novo equipamento na base de dados."
      />
      <Card className="max-w-2xl p-6">
        <NewEquipmentForm />
      </Card>
    </>
  );
}
