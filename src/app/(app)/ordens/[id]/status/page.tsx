import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { InfoList, InfoItem } from "@/components/info-list";
import { StatusChangeWrapper } from "./status-change-wrapper";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { statusLabel } from "@/lib/status";

export default async function StatusChangePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePermission("os:changeStatus");

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    select: {
      id: true,
      number: true,
      status: true,
      customerId: true,
      customer: { select: { name: true } },
      equipment: { select: { brand: true, model: true } },
    },
  });

  if (!order) notFound();

  return (
    <>
      <PageHeader
        title={`Alterar Status - ${order.number}`}
        description={`Ordem de serviço de ${order.customer?.name}`}
        breadcrumb={
          <Link href={`/ordens/${id}`} className="hover:underline">
            Voltar
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Status Atual */}
          <Card>
            <CardHeader title="Status Atual" />
            <CardBody className="pt-0">
              <InfoList>
                <InfoItem label="Status">
                  <StatusBadge status={order.status} />
                </InfoItem>
                <InfoItem label="Descrição">{statusLabel(order.status)}</InfoItem>
              </InfoList>
            </CardBody>
          </Card>

          {/* Formulário de Alteração */}
          <Card>
            <CardHeader title="Novo Status" />
            <CardBody className="pt-0">
              <StatusChangeWrapper
                orderId={order.id}
                currentStatus={order.status}
              />
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Equipamento */}
          {order.equipment && (
            <Card>
              <CardHeader title="Equipamento" />
              <CardBody className="pt-0">
                <p className="font-semibold text-brand-700 dark:text-brand-300">
                  {order.equipment.brand || "S/marca"} {order.equipment.model}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Ações */}
          <div className="space-y-2">
            <Link href={`/ordens/${id}`} className="block">
              <Button variant="ghost" className="gap-2 w-full justify-start">
                <ArrowLeft className="h-4 w-4" />
                Voltar à O.S.
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
