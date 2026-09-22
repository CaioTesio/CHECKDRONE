"use client";

import { useRouter } from "next/navigation";
import { CustomerForm, type CustomerFormValues } from "@/components/customers/customer-form";
import { useToast } from "@/components/ui/toast";
import { updateCustomerAction } from "@/server/actions/customers";

export function EditCustomerForm({ customer }: { customer: CustomerFormValues }) {
  const router = useRouter();
  const toast = useToast();

  return (
    <CustomerForm
      action={updateCustomerAction}
      customer={customer}
      submitLabel="Salvar alterações"
      onSuccess={({ message }) => {
        toast(message ?? "Cliente atualizado.");
        router.push(`/clientes/${customer.id}`);
      }}
    />
  );
}
