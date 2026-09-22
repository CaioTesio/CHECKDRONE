import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/search-field";
import { Pagination } from "@/components/pagination";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/roles";
import { formatDocument, formatPhone } from "@/lib/format";

export const metadata: Metadata = { title: "Clientes" };
export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requirePermission("customer:view");
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { document: { contains: q.replace(/\D+/g, "") || "\u0000" } },
          { phone: { contains: q.replace(/\D+/g, "") || "\u0000" } },
          { whatsapp: { contains: q.replace(/\D+/g, "") || "\u0000" } },
          { email: { contains: q } },
          { city: { contains: q } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        name: true,
        document: true,
        docType: true,
        phone: true,
        whatsapp: true,
        city: true,
        state: true,
        _count: { select: { serviceOrders: true, equipment: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Clientes"
        description={`${total} ${total === 1 ? "cliente cadastrado" : "clientes cadastrados"}.`}
        actions={
          can(user.role, "customer:manage") ? (
            <Link href="/clientes/novo">
              <Button>
                <Plus className="h-4 w-4" />
                Novo cliente
              </Button>
            </Link>
          ) : null
        }
      />

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--surface-border)] p-4">
          <SearchField
            placeholder="Buscar por nome, CPF/CNPJ, telefone, e-mail ou cidade…"
            defaultValue={q}
          />
        </div>

        {customers.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title={q ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            description={
              q ? "Tente outro termo de busca." : "Cadastre o primeiro cliente da assistência."
            }
          />
        ) : (
          <ul className="divide-y divide-[var(--surface-border)]">
            {customers.map((customer) => (
              <li key={customer.id}>
                <Link
                  href={`/clientes/${customer.id}`}
                  className="flex items-center gap-4 px-4 py-4 hover:bg-ink-50 sm:px-5 dark:hover:bg-ink-800/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{customer.name}</p>
                    <p className="mt-0.5 truncate text-sm muted">
                      {customer.docType} {formatDocument(customer.document)}
                      {customer.phone ? ` · ${formatPhone(customer.phone)}` : ""}
                      {customer.city ? ` · ${customer.city}/${customer.state ?? ""}` : ""}
                    </p>
                  </div>
                  <div className="hidden shrink-0 gap-2 sm:flex">
                    <Badge>{customer._count.equipment} equip.</Badge>
                    <Badge>{customer._count.serviceOrders} O.S.</Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Pagination total={total} page={page} perPage={PER_PAGE} />
      </Card>
    </div>
  );
}
