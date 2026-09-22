import Link from "next/link";
import { notFound } from "next/navigation";
import { Edit2, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoList, InfoItem } from "@/components/info-list";
import { OrdersTable } from "@/components/orders/orders-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export default async function EquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermission("equipment:view");

  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: {
      customer: true,
      serviceOrders: {
        select: {
          id: true,
          number: true,
          status: true,
          entryAt: true,
          maintenanceType: true,
          maintenanceTypeOther: true,
          customer: { select: { id: true, name: true } },
          equipment: { select: { brand: true, model: true, serialNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!equipment) notFound();

  return (
    <>
      <PageHeader
        title={`${equipment.brand || "Equipamento"} ${equipment.model}`}
        description={equipment.customer?.name}
        breadcrumb={
          <Link href="/equipamentos" className="hover:underline">
            Equipamentos
          </Link>
        }
        actions={
          <Link href={`/equipamentos/${id}/editar`}>
            <Button size="sm" variant="secondary" className="gap-2">
              <Edit2 className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader
              title="Detalhes do Equipamento"
              description="Informações do equipamento registrado"
            />
            <CardBody className="pt-0">
              <InfoList>
                <InfoItem label="Marca">{equipment.brand || "—"}</InfoItem>
                <InfoItem label="Modelo">{equipment.model}</InfoItem>
                {equipment.category && (
                  <InfoItem label="Categoria">{equipment.category}</InfoItem>
                )}
                {equipment.serialNumber && (
                  <InfoItem label="Série">{equipment.serialNumber}</InfoItem>
                )}
                {equipment.assetTag && (
                  <InfoItem label="Ativo">{equipment.assetTag}</InfoItem>
                )}
                {equipment.notes && (
                  <InfoItem label="Observações" full>{equipment.notes}</InfoItem>
                )}
                <InfoItem label="Registrado em">
                  {formatDateTime(equipment.createdAt)}
                </InfoItem>
              </InfoList>
            </CardBody>
          </Card>

          {equipment.serviceOrders.length > 0 ? (
            <Card>
              <CardHeader
                title="Ordens de Serviço"
                description={`${equipment.serviceOrders.length} ordens relacionadas`}
              />
              <OrdersTable
                orders={equipment.serviceOrders}
                emptyTitle="Nenhuma ordem de serviço"
              />
            </Card>
          ) : (
            <EmptyState
              title="Nenhuma ordem de serviço"
              description="Este equipamento ainda não tem ordens de serviço registradas."
            />
          )}
        </div>

        {equipment.customer && (
          <div>
            <Card>
              <CardHeader title="Cliente" />
              <CardBody className="pt-0">
                <Link href={`/clientes/${equipment.customer.id}`}>
                  <div className="group">
                    <p className="font-semibold text-brand-700 dark:text-brand-300 group-hover:underline">
                      {equipment.customer.name}
                    </p>
                    {equipment.customer.phone && (
                      <p className="mt-2 text-sm muted">{equipment.customer.phone}</p>
                    )}
                    {equipment.customer.city && (
                      <p className="mt-1 text-sm muted">{equipment.customer.city}</p>
                    )}
                  </div>
                </Link>
                <Link href={`/clientes/${equipment.customer.id}`}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-3 gap-2 w-full justify-start"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Ir para Cliente
                  </Button>
                </Link>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
