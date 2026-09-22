import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/pagination";
import { SearchField } from "@/components/search-field";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrdersTable } from "@/components/orders/orders-table";

const PER_PAGE = 20;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const { q = "", page = "1", status } = await searchParams;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const skip = (pageNum - 1) * PER_PAGE;

  await requirePermission("os:view");

  const where = {
    ...(q && {
      OR: [
        { number: { contains: q, mode: "insensitive" as const } },
        { customer: { name: { contains: q, mode: "insensitive" as const } } },
        { equipment: { model: { contains: q, mode: "insensitive" as const } } },
      ],
    }),
    ...(status && { status }),
  };

  const [total, orders] = await Promise.all([
    prisma.serviceOrder.count({ where }),
    prisma.serviceOrder.findMany({
      where,
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
      skip,
      take: PER_PAGE,
    }),
  ]);

  const pages = Math.ceil(total / PER_PAGE);

  return (
    <>
      <PageHeader
        title="Ordens de Serviço"
        description="Visualizar e gerenciar todas as ordens de serviço."
        actions={
          <Link href="/ordens/novo">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova O.S.
            </Button>
          </Link>
        }
      />

      <Card className="mb-4 p-4">
        <SearchField placeholder="Nº O.S., cliente ou equipamento..." />
      </Card>

      {orders.length === 0 ? (
        <EmptyState
          title={q ? "Nenhuma O.S. encontrada" : "Nenhuma O.S. registrada"}
          description={
            q ? "Tente refinar sua busca." : "Crie a primeira ordem de serviço para começar."
          }
          action={
            !q && (
              <Link href="/ordens/novo">
                <Button size="sm">Nova O.S.</Button>
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="mb-4 -mx-4 overflow-x-auto">
            <OrdersTable orders={orders} />
          </div>
          {pages > 1 && <Pagination page={pageNum} total={total} perPage={PER_PAGE} />}
        </>
      )}
    </>
  );
}
