import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { NewCustomerForm } from "./new-customer-form";

export const metadata: Metadata = { title: "Novo cliente" };

export default async function NewCustomerPage() {
  await requirePermission("customer:manage");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Novo cliente"
        breadcrumb={
          <Link href="/clientes" className="hover:underline">
            Clientes
          </Link>
        }
        description="Cadastre os dados do cliente para vincular equipamentos e ordens de serviço."
      />
      <Card>
        <CardBody>
          <NewCustomerForm />
        </CardBody>
      </Card>
    </div>
  );
}
