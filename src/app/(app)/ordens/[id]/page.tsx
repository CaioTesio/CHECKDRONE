import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { InfoList, InfoItem } from "@/components/info-list";
import { PhotoUploadForm } from "@/components/orders/photo-upload-form";
import { ServiceOrderPhotos } from "@/components/orders/service-order-photos";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { formatDateTime, formatDate, formatTime } from "@/lib/format";
import { MAINTENANCE_TYPES } from "@/lib/catalog";

export default async function ServiceOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePermission("os:view");

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      equipment: true,
      items: true,
      history: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
      createdBy: { select: { name: true } },
      assignedTo: { select: { name: true } },
      photos: {
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { name: true } } },
      },
    },
  });

  if (!order) notFound();

  const maintenanceTypeLabel =
    MAINTENANCE_TYPES.find((t) => t.code === order.maintenanceType)?.label ||
    order.maintenanceType;

  return (
    <>
      <PageHeader
        title={order.number}
        description={order.customer?.name}
        breadcrumb={
          <Link href="/ordens" className="hover:underline">
            Ordens
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Status Card */}
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs muted uppercase">Status</p>
                  <StatusBadge status={order.status} className="mt-1" />
                </div>
                {user.role === "TECNICO" || user.role === "ADMIN" ? (
                  <Link href={`/ordens/${id}/status`}>
                    <Button size="sm" variant="secondary">
                      Alterar Status
                    </Button>
                  </Link>
                ) : null}
              </div>
            </CardBody>
          </Card>

          {/* Informações Gerais */}
          <Card>
            <CardHeader title="Informações Gerais" />
            <CardBody className="pt-0">
              <InfoList>
                <InfoItem label="Nº O.S.">{order.number}</InfoItem>
                <InfoItem label="Equipamento">
                  {order.equipment?.brand && `${order.equipment.brand} `}
                  {order.equipment?.model}
                </InfoItem>
                <InfoItem label="Data de entrada">
                  {formatDateTime(order.entryAt)}
                </InfoItem>
                <InfoItem label="Tipo de manutenção">{maintenanceTypeLabel}</InfoItem>
                <InfoItem label="Criada por">{order.createdBy?.name}</InfoItem>
                {order.assignedTo && (
                  <InfoItem label="Atribuída a">{order.assignedTo.name}</InfoItem>
                )}
              </InfoList>
            </CardBody>
          </Card>

          {/* Relatório de Entrada */}
          <Card>
            <CardHeader title="Relatório de Entrada" />
            <CardBody className="pt-0">
              <InfoList>
                {order.customerReport && (
                  <InfoItem label="Relato do cliente" full>
                    {order.customerReport}
                  </InfoItem>
                )}
                {order.requestedService && (
                  <InfoItem label="Serviço solicitado" full>
                    {order.requestedService}
                  </InfoItem>
                )}
                {order.entryNotes && (
                  <InfoItem label="Observações" full>
                    {order.entryNotes}
                  </InfoItem>
                )}
              </InfoList>
            </CardBody>
          </Card>

          {/* Itens */}
          {order.items.length > 0 && (
            <Card>
              <CardHeader
                title="Itens"
                description={`${order.items.length} itens registrados`}
              />
              <CardBody className="pt-0">
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm border-b pb-2">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        {item.notes && <p className="text-xs muted">{item.notes}</p>}
                      </div>
                      <p className="text-sm font-semibold">{item.quantity}x</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Fotos */}
          <Card>
            <CardHeader
              title="Fotos"
              description={`${order.photos.length} foto${order.photos.length !== 1 ? "s" : ""}`}
            />
            <CardBody className="pt-0 space-y-6">
              {can(user.role, "os:addPhotos") && (
                <PhotoUploadForm orderId={order.id} />
              )}
              <ServiceOrderPhotos photos={order.photos.map((p) => ({
                ...p,
                uploadedBy: p.uploadedBy || { name: "Anônimo" },
              }))} />
            </CardBody>
          </Card>

          {/* Histórico */}
          <Card>
            <CardHeader
              title="Histórico"
              description={`${order.history.length} alterações registradas`}
            />
            <CardBody className="pt-0">
              <div className="space-y-4">
                {order.history.map((entry, idx) => (
                  <div key={entry.id} className={idx !== 0 ? "border-t pt-4" : ""}>
                    <div className="flex items-center gap-2">
                      {entry.toStatus && <StatusBadge status={entry.toStatus} />}
                      <span className="text-xs muted">{entry.user?.name}</span>
                    </div>
                    <p className="mt-1 text-xs muted">{entry.message}</p>
                    <p className="mt-1 text-xs muted">{formatDateTime(entry.createdAt)}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Cliente */}
          {order.customer && (
            <Card>
              <CardHeader title="Cliente" />
              <CardBody className="pt-0">
                <Link href={`/clientes/${order.customer.id}`}>
                  <div className="group">
                    <p className="font-semibold text-brand-700 dark:text-brand-300 group-hover:underline">
                      {order.customer.name}
                    </p>
                    {order.customer.phone && (
                      <p className="mt-1 text-sm muted">{order.customer.phone}</p>
                    )}
                    {order.customer.city && (
                      <p className="text-sm muted">{order.customer.city}</p>
                    )}
                  </div>
                </Link>
              </CardBody>
            </Card>
          )}

          {/* Equipamento */}
          {order.equipment && (
            <Card>
              <CardHeader title="Equipamento" />
              <CardBody className="pt-0">
                <Link href={`/equipamentos/${order.equipment.id}`}>
                  <div className="group">
                    <p className="font-semibold text-brand-700 dark:text-brand-300 group-hover:underline">
                      {order.equipment.brand || "S/marca"} {order.equipment.model}
                    </p>
                    {order.equipment.serialNumber && (
                      <p className="mt-1 text-sm muted">Série: {order.equipment.serialNumber}</p>
                    )}
                  </div>
                </Link>
              </CardBody>
            </Card>
          )}

          {/* Ações */}
          <div className="space-y-2">
            <Link href="/ordens" className="block">
              <Button variant="ghost" className="gap-2 w-full justify-start">
                <ArrowLeft className="h-4 w-4" />
                Voltar às Ordens
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
