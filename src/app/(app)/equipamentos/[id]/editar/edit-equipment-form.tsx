"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { EquipmentForm } from "@/components/equipment/equipment-form";

interface Equipment {
  id: string;
  customerId: string | null;
  category?: string | null;
  brand: string | null;
  model: string;
  serialNumber?: string | null;
  assetTag?: string | null;
  notes?: string | null;
}

export function EditEquipmentForm({
  equipment,
  customer,
}: {
  equipment: Equipment;
  customer: { id: string; name: string } | null;
}) {
  const router = useRouter();
  const toast = useToast();

  return (
    <EquipmentForm
      initialData={equipment}
      initialCustomer={customer}
      onSuccess={() => {
        toast("Equipamento atualizado com sucesso", "success");
        router.push(`/equipamentos/${equipment.id}`);
      }}
    />
  );
}
