import { notFound } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/db";
import { statusLabel } from "@/lib/status";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

export default async function PublicOrderTrackingPage({
  params,
}: {
  params: Promise<{ number: string; token: string }>;
}) {
  const { number, token } = await params;

  const order = await prisma.serviceOrder.findFirst({
    where: {
      number: number.toUpperCase(),
      publicToken: token.toUpperCase(),
    },
    include: {
      customer: { select: { name: true, phone: true, city: true } },
      equipment: { select: { brand: true, model: true } },
      history: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Acompanhamento de O.S.
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            {order.number}
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Status Atual
              </p>
              <div className="flex items-center gap-2">
                <StatusBadge status={order.status} />
                <span className="text-lg font-semibold text-slate-900 dark:text-white">
                  {statusLabel(order.status)}
                </span>
              </div>
            </div>

            {order.closedAt && (
              <div className="border-t border-[var(--surface-border)] pt-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Finalizada em {formatDateTime(order.closedAt)}
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Customer Info */}
        {order.customer && (
          <Card>
            <CardHeader title="Informações do Cliente" />
            <CardBody className="space-y-3">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Nome</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {order.customer.name}
                </p>
              </div>
              {order.customer.phone && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Telefone</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {order.customer.phone}
                  </p>
                </div>
              )}
              {order.customer.city && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Cidade</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {order.customer.city}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Equipment Info */}
        {order.equipment && (
          <Card>
            <CardHeader title="Equipamento" />
            <CardBody>
              <p className="font-semibold text-slate-900 dark:text-white">
                {order.equipment.brand || "S/marca"} {order.equipment.model}
              </p>
            </CardBody>
          </Card>
        )}

        {/* Timeline */}
        {order.history.length > 0 && (
          <Card>
            <CardHeader
              title="Histórico"
              description={`${order.history.length} atualização${order.history.length !== 1 ? "s" : ""}`}
            />
            <CardBody>
              <div className="space-y-4">
                {order.history.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={`flex gap-4 ${idx !== 0 ? "border-t border-[var(--surface-border)] pt-4" : ""}`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      {idx !== order.history.length - 1 && (
                        <div className="mt-2 h-8 w-0.5 bg-blue-200 dark:bg-blue-900" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {entry.message}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tem alguma dúvida? Entre em contato conosco.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Última atualização: {formatDateTime(order.updatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
