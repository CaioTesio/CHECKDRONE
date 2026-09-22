import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EditCustomerForm } from "./edit-customer-form";

export const metadata: Metadata = { title: "Editar cliente" };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("customer:manage");
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Editar cliente"
        breadcrumb={
          <>
            <Link href="/clientes" className="hover:underline">
              Clientes
            </Link>
            {" / "}
            <Link href={`/clientes/${customer.id}`} className="hover:underline">
              {customer.name}
            </Link>
          </>
        }
      />
      <Card>
        <CardBody>
          <EditCustomerForm customer={customer} />
        </CardBody>
      </Card>
    </div>
  );
}
