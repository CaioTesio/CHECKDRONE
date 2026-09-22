import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Hourglass,
  PackageCheck,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { OrdersTable } from "@/components/orders/orders-table";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DASHBOARD_GROUPS } from "@/lib/status";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const CARD_STYLES: Record<
  string,
  { icon: typeof ClipboardList; accent: string; href: string }
> = {
  abertas: {
    icon: ClipboardList,
    accent: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300",
    href: "/ordens?status=ABERTAS",
  },
  analise: {
    icon: Clock,
    accent: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    href: "/ordens?status=EM_ANALISE",
  },
  aprovacao: {
    icon: Hourglass,
    accent: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
    href: "/ordens?status=AGUARDANDO_APROVACAO",
  },
  manutencao: {
    icon: Wrench,
    accent: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    href: "/ordens?status=EM_MANUTENCAO",
  },
  prontas: {
    icon: PackageCheck,
    accent: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    href: "/ordens?status=PRONTA_PARA_RETIRADA",
  },
  finalizadas: {
    icon: CheckCircle2,
    accent: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
    href: "/ordens?status=FINALIZADA",
  },
};

export default async function DashboardPage() {
  const user = await requirePermission("dashboard:view");

  const [grouped, latest] = await Promise.all([
    prisma.serviceOrder.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.serviceOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
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
    }),
  ]);

  const countByStatus = new Map(grouped.map((g) => [g.status, g._count._all]));
  const countFor = (statuses: readonly string[]) =>
    statuses.reduce((sum, status) => sum + (countByStatus.get(status) ?? 0), 0);

  const firstName = user.name.split(/\s+/)[0];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`Olá, ${firstName}`}
        description="Panorama das ordens de serviço da assistência técnica."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {DASHBOARD_GROUPS.map((group) => {
          const style = CARD_STYLES[group.key];
          const Icon = style.icon;
          return (
            <Link key={group.key} href={style.href} className="group">
              <Card className="h-full p-4 transition-shadow hover:shadow-md">
                <span
                  className={cn(
                    "mb-3 flex h-9 w-9 items-center justify-center rounded-lg",
                    style.accent,
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <p className="text-2xl font-semibold tabular-nums">{countFor(group.statuses)}</p>
                <p className="mt-0.5 text-xs leading-snug muted">{group.label}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="mt-5 overflow-hidden">
        <CardHeader
          title="Últimas Ordens de Serviço"
          description="As 8 O.S. mais recentes registradas."
          icon={<ClipboardList className="h-[18px] w-[18px]" />}
          action={
            <Link
              href="/ordens"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
            >
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <OrdersTable
          orders={latest}
          emptyTitle="Nenhuma O.S. registrada ainda"
          emptyDescription="Abra a primeira ordem de serviço para começar."
        />
      </Card>
    </div>
  );
}
