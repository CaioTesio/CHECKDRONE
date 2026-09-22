"use client";

import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import { useToast } from "@/components/ui/toast";
import { createCustomerAction } from "@/server/actions/customers";

export function NewCustomerForm() {
  const router = useRouter();
  const toast = useToast();

  return (
    <CustomerForm
      action={createCustomerAction}
      submitLabel="Cadastrar cliente"
      onSuccess={({ id, message }) => {
        toast(message ?? "Cliente cadastrado com sucesso.");
        router.push(id ? `/clientes/${id}` : "/clientes");
      }}
    />
  );
}
