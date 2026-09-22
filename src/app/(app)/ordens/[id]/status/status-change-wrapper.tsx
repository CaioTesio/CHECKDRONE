"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { StatusChangeForm } from "@/components/orders/status-change-form";

export function StatusChangeWrapper({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const toast = useToast();

  return (
    <StatusChangeForm
      orderId={orderId}
      currentStatus={currentStatus}
      onSuccess={() => {
        toast("Status alterado com sucesso", "success");
        router.push(`/ordens/${orderId}`);
      }}
    />
  );
}
