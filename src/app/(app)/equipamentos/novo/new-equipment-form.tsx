"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { EquipmentForm } from "@/components/equipment/equipment-form";

export function NewEquipmentForm() {
  const router = useRouter();
  const toast = useToast();

  return (
    <EquipmentForm
      onSuccess={(id) => {
        toast("Equipamento registrado com sucesso", "success");
        router.push(`/equipamentos/${id}`);
      }}
    />
  );
}
