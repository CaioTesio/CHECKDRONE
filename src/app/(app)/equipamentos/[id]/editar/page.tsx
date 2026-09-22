import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EditEquipmentForm } from "./edit-equipment-form";

export default async function EditEquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermission("equipment:update");

  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!equipment) notFound();

  return (
    <>
      <PageHeader
        title="Editar Equipamento"
        description="Atualize as informações do equipamento"
        breadcrumb={
          <Link href={`/equipamentos/${id}`} className="hover:underline">
            {equipment.brand} {equipment.model}
          </Link>
        }
      />
      <Card className="max-w-2xl p-6">
        <EditEquipmentForm equipment={equipment} customer={equipment.customer} />
      </Card>
    </>
  );
}
