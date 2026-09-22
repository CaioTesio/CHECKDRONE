import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, Mail, MapPin, Pencil, Phone, Plane, Plus, User } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoItem, InfoList } from "@/components/info-list";
import { OrdersTable } from "@/components/orders/orders-table";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/roles";
import { formatDate, formatDocument, formatPhone, toWhatsAppNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: customer?.name ?? "Cliente" };
}

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("customer:view");
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      equipment: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { serviceOrders: true } } },
      },
      serviceOrders: {
        orderBy: { createdAt: "desc" },
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
      },
    },
  });

  if (!customer) notFound();

  const address = [
    [customer.street, customer.number].filter(Boolean).join(", "),
    customer.complement,
    customer.district,
    [customer.city, customer.state].filter(Boolean).join("/"),
    customer.zipCode,
  ]
    .filter(Boolean)
    .join(" · ");

  const whatsapp = toWhatsAppNumber(customer.whatsapp ?? customer.phone);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={customer.name}
        breadcrumb={
          <Link href="/clientes" className="hover:underline">
            Clientes
          </Link>
        }
        description={`${customer.docType} ${formatDocument(customer.document)} · Cliente desde ${formatDate(customer.createdAt)}`}
        actions={
          <>
            {whatsapp ? (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">
                  <Phone className="h-4 w-4" />
                  WhatsApp
                </Button>
              </a>
            ) : null}
            {can(user.role, "customer:manage") ? (
              <Link href={`/clientes/${customer.id}/editar`}>
                <Button variant="secondary">
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </Link>
            ) : null}
            {can(user.role, "os:create") ? (
              <Link href={`/ordens/nova?cliente=${customer.id}`}>
                <Button>
                  <Plus className="h-4 w-4" />
                  Nova O.S.
                </Button>
              </Link>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Dados do cliente" icon={<User className="h-[18px] w-[18px]" />} />
          <CardBody>
            <InfoList>
              <InfoItem label="Telefone" full>
                {customer.phone ? (
                  <a href={`tel:${customer.phone}`} className="hover:underline">
                    {formatPhone(customer.phone)}
                  </a>
                ) : (
                  "—"
                )}
              </InfoItem>
              <InfoItem label="WhatsApp" full>
                {customer.whatsapp ? formatPhone(customer.whatsapp) : "—"}
              </InfoItem>
              <InfoItem label="E-mail" full>
                {customer.email ? (
                  <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-1.5 hover:underline">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </a>
                ) : (
                  "—"
                )}
              </InfoItem>
              <InfoItem label="Endereço" full>
                {address ? (
                  <span className="inline-flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {address}
                  </span>
                ) : (
                  "—"
                )}
              </InfoItem>
              {customer.notes ? (
                <InfoItem label="Observações internas" full>
                  {customer.notes}
                </InfoItem>
              ) : null}
            </InfoList>
          </CardBody>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader
              title="Equipamentos vinculados"
              description={`${customer.equipment.length} equipamento(s)`}
              icon={<Plane className="h-[18px] w-[18px]" />}
              action={
                can(user.role, "equipment:manage") ? (
                  <Link href={`/equipamentos/novo?cliente=${customer.id}`}>
                    <Button size="sm" variant="secondary">
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </Link>
                ) : null
              }
            />
            {customer.equipment.length === 0 ? (
              <EmptyState
                icon={<Plane className="h-6 w-6" />}
                title="Nenhum equipamento cadastrado"
                description="Os equipamentos ficam salvos para as próximas ordens de serviço."
              />
            ) : (
              <ul className="divide-y divide-[var(--surface-border)]">
                {customer.equipment.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/equipamentos/${item.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-ink-50 dark:hover:bg-ink-800/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {[item.brand, item.model].filter(Boolean).join(" ")}
                        </p>
                        <p className="truncate text-sm muted">
                          {item.category}
                          {item.serialNumber ? ` · S/N ${item.serialNumber}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm muted">
                        {item._count.serviceOrders} O.S.
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Histórico de O.S."
              description={`${customer.serviceOrders.length} ordem(ns) de serviço`}
              icon={<ClipboardList className="h-[18px] w-[18px]" />}
            />
            <OrdersTable
              orders={customer.serviceOrders}
              emptyTitle="Nenhuma O.S. para este cliente"
              emptyDescription="Abra a primeira ordem de serviço deste cliente."
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
