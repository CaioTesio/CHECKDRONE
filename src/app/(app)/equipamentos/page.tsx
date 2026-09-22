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
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/format";

const PER_PAGE = 20;

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const skip = (pageNum - 1) * PER_PAGE;

  await requirePermission("equipment:view");

  const where = q
    ? {
        OR: [
          { brand: { contains: q, mode: "insensitive" as const } },
          { model: { contains: q, mode: "insensitive" as const } },
          { serialNumber: { contains: q, mode: "insensitive" as const } },
          { customer: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : undefined;

  const [total, equipment] = await Promise.all([
    prisma.equipment.count({ where }),
    prisma.equipment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
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
        title="Equipamentos"
        description="Controle de equipamentos registrados na base de dados."
        actions={
          <Link href="/equipamentos/novo">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          </Link>
        }
      />

      <Card className="mb-4 p-4">
        <SearchField placeholder="Marca, modelo, série ou cliente..." />
      </Card>

      {equipment.length === 0 ? (
        <EmptyState
          title={q ? "Nenhum equipamento encontrado" : "Nenhum equipamento registrado"}
          description={q ? "Tente refinar sua busca." : "Registre o primeiro equipamento para começar."}
          action={
            !q && (
              <Link href="/equipamentos/novo">
                <Button size="sm">Novo equipamento</Button>
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {equipment.map((item) => (
              <Link key={item.id} href={`/equipamentos/${item.id}`}>
                <Card className="group h-full p-4 transition-shadow hover:shadow-md">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-brand-700 dark:text-brand-300 group-hover:underline">
                        {item.brand || "Sem marca"}
                      </p>
                      <p className="mt-0.5 truncate text-sm muted">{item.model}</p>
                    </div>
                    <div className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                      <span className="text-xs font-semibold">{initials(item.brand || "?")}</span>
                    </div>
                  </div>
                  <div className="mb-3 space-y-1 text-xs">
                    {item.serialNumber && (
                      <p>
                        <span className="muted">Série:</span> {item.serialNumber}
                      </p>
                    )}
                    {item.assetTag && (
                      <p>
                        <span className="muted">Ativo:</span> {item.assetTag}
                      </p>
                    )}
                  </div>
                  {item.customer && (
                    <Badge className="text-xs">
                      {item.customer.name}
                    </Badge>
                  )}
                </Card>
              </Link>
            ))}
          </div>

          {pages > 1 && <Pagination page={pageNum} total={total} perPage={PER_PAGE} />}
        </>
      )}
    </>
  );
}
