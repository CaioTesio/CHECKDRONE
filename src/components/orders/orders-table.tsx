import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { maintenanceLabel } from "@/lib/catalog";
import { formatDateTime } from "@/lib/format";

export type OrderRow = {
  id: string;
  number: string;
  status: string;
  entryAt: Date;
  maintenanceType: string;
  maintenanceTypeOther: string | null;
  customer: { id: string; name: string };
  equipment: { brand: string | null; model: string; serialNumber: string | null };
};

export function OrdersTable({
  orders,
  emptyTitle = "Nenhuma O.S. encontrada",
  emptyDescription,
}: {
  orders: OrderRow[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-6 w-6" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <>
      {/* Tabela — telas médias e maiores */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--surface-border)] text-left text-xs uppercase tracking-wide muted">
              <th className="px-5 py-3 font-medium">O.S.</th>
              <th className="px-5 py-3 font-medium">Cliente</th>
              <th className="px-5 py-3 font-medium">Equipamento</th>
              <th className="px-5 py-3 font-medium">Entrada</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium sr-only">Ações</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-[var(--surface-border)] last:border-0 hover:bg-ink-50 dark:hover:bg-ink-800/40"
              >
                <td className="px-5 py-3.5">
                  <Link
                    href={`/ordens/${order.id}`}
                    className="font-medium text-brand-700 hover:underline dark:text-brand-400"
                  >
                    {order.number}
                  </Link>
                </td>
                <td className="max-w-[15rem] truncate px-5 py-3.5">{order.customer.name}</td>
                <td className="px-5 py-3.5">
                  <span className="block">
                    {[order.equipment.brand, order.equipment.model].filter(Boolean).join(" ")}
                  </span>
                  {order.equipment.serialNumber ? (
                    <span className="block text-xs muted">S/N {order.equipment.serialNumber}</span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 muted">
                  {formatDateTime(order.entryAt)}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 muted">
                  {maintenanceLabel(order.maintenanceType, order.maintenanceTypeOther)}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={order.status} size="sm" />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/ordens/${order.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
                  >
                    Abrir
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartões — celular */}
      <ul className="divide-y divide-[var(--surface-border)] md:hidden">
        {orders.map((order) => (
          <li key={order.id}>
            <Link href={`/ordens/${order.id}`} className="flex items-start gap-3 px-4 py-4 active:bg-ink-50">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{order.number}</span>
                  <StatusBadge status={order.status} size="sm" />
                </div>
                <p className="mt-1 truncate text-sm">{order.customer.name}</p>
                <p className="truncate text-sm muted">
                  {[order.equipment.brand, order.equipment.model].filter(Boolean).join(" ")}
                </p>
                <p className="mt-1 text-xs muted">
                  {formatDateTime(order.entryAt)} ·{" "}
                  {maintenanceLabel(order.maintenanceType, order.maintenanceTypeOther)}
                </p>
              </div>
              <ChevronRight className="mt-1 h-5 w-5 shrink-0 muted" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
