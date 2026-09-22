import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewServiceOrderForm } from "./new-service-order-form";

export default async function NewOrderPage() {
  const user = await requirePermission("os:create");

  const [customers, equipment] = await Promise.all([
    prisma.customer.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.equipment.findMany({
      select: {
        id: true,
        customerId: true,
        brand: true,
        model: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (customers.length === 0) {
    return (
      <>
        <PageHeader
          title="Criar Ordem de Serviço"
          description="Nenhum cliente disponível"
        />
        <Card className="p-6 text-center">
          <p className="text-sm text-muted">
            Cadastre um cliente antes de criar uma ordem de serviço.
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Criar Ordem de Serviço"
        description="Registre uma nova ordem de serviço no sistema"
      />
      <Card className="p-6">
        <NewServiceOrderForm customers={customers} equipment={equipment} />
      </Card>
    </>
  );
}
