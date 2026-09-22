"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { ServiceOrderForm } from "@/components/orders/service-order-form";

export function NewServiceOrderForm({
  customers,
  equipment,
}: {
  customers: Array<{ id: string; name: string }>;
  equipment: Array<{ id: string; customerId: string; brand: string | null; model: string }>;
}) {
  const router = useRouter();
  const toast = useToast();

  return (
    <ServiceOrderForm
      customers={customers}
      equipment={equipment}
      onSuccess={(id, number) => {
        toast("Ordem de serviço criada com sucesso", "success");
        router.push(`/ordens/${id}`);
      }}
    />
  );
}
