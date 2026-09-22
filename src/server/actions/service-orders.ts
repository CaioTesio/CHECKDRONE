"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { formatOsNumber, nextSequence, generatePublicToken } from "@/lib/os-number";
import { isValidStatus } from "@/lib/status";
import { createOrderSchema, type CreateOrderInput } from "@/server/validation";
import { actionError, type FormResult } from "./result";
import { z } from "zod";

export async function createServiceOrderAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  try {
    const user = await requirePermission("os:create");

    // Parse form data
    const dataStr = formData.get("data");
    if (!dataStr) return { ok: false, error: "Dados não fornecidos" };

    let parsed;
    try {
      const data = JSON.parse(String(dataStr)) as unknown;
      parsed = createOrderSchema.safeParse(data);
    } catch {
      return { ok: false, error: "Dados inválidos" };
    }

    if (!parsed.success) return actionError(parsed.error);

    const { customerId, equipmentId, entryAt, maintenanceType, items, photos, ...rest } =
      parsed.data;

    // Verify customer and equipment exist
    const [customer, equipment] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } }),
      prisma.equipment.findUnique({
        where: { id: equipmentId },
        select: { id: true, customerId: true },
      }),
    ]);

    if (!customer) return { ok: false, error: "Cliente não encontrado" };
    if (!equipment) return { ok: false, error: "Equipamento não encontrado" };
    if (equipment.customerId !== customerId)
      return { ok: false, error: "Equipamento não pertence ao cliente" };

    const now = new Date();
    const year = now.getFullYear();

    // Create service order with all related data (in transaction for atomicity)
    const serviceOrder = await prisma.$transaction(async (tx) => {
      const seq = await nextSequence(tx, year);
      const number = formatOsNumber(year, seq);

      return tx.serviceOrder.create({
        data: {
          number,
          year,
          seq,
          customerId,
          equipmentId,
          entryAt,
          status: "RECEBIDA",
          maintenanceType,
          maintenanceTypeOther: rest.maintenanceTypeOther,
          customerReport: rest.customerReport,
          requestedService: rest.requestedService,
          entryNotes: rest.entryNotes,
          publicToken: generatePublicToken(),
          createdById: user.id,
          assignedToId: user.role === "TECNICO" ? user.id : undefined,
          items: {
            create: items.map((item) => ({
              label: item.label,
              quantity: item.quantity,
              notes: item.notes,
              isCustom: item.isCustom ?? false,
            })),
          },
          history: {
            create: {
              type: "CREATED",
              message: "Ordem de serviço criada",
              toStatus: "RECEBIDA",
              user: { connect: { id: user.id } },
            },
          },
        },
      });
    });

    await audit({
      userId: user.id,
      action: "CREATE",
      entity: "ServiceOrder",
      entityId: serviceOrder.id,
      data: {
        number: serviceOrder.number,
        customerId: serviceOrder.customerId,
        equipmentId: serviceOrder.equipmentId,
        maintenanceType: serviceOrder.maintenanceType,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/ordens");
    revalidatePath(`/clientes/${customerId}`);
    revalidatePath(`/equipamentos/${equipmentId}`);

    return { ok: true, id: serviceOrder.id, message: `O.S. ${serviceOrder.number} criada` };
  } catch (error) {
    console.error("[service-order-create]", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível criar a O.S.",
    };
  }
}

const updateStatusSchema = z.object({
  orderId: z.string().cuid(),
  newStatus: z.string().min(1),
  internalNotes: z.string().max(2000).optional(),
});

export async function updateServiceOrderStatusAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  try {
    const user = await requirePermission("os:changeStatus");

    const dataStr = formData.get("data");
    if (!dataStr) return { ok: false, error: "Dados não fornecidos" };

    let parsed;
    try {
      const data = JSON.parse(String(dataStr)) as unknown;
      parsed = updateStatusSchema.safeParse(data);
    } catch {
      return { ok: false, error: "Dados inválidos" };
    }

    if (!parsed.success) return actionError(parsed.error);

    const { orderId, newStatus, internalNotes } = parsed.data;

    // Validate status
    if (!isValidStatus(newStatus)) {
      return { ok: false, error: "Status inválido" };
    }

    // Verify order exists
    const order = await prisma.serviceOrder.findUnique({
      where: { id: orderId },
      select: { id: true, number: true, status: true, customerId: true, equipmentId: true },
    });

    if (!order) return { ok: false, error: "Ordem de serviço não encontrada" };
    if (order.status === newStatus)
      return { ok: false, error: "O novo status é igual ao status atual" };

    // Update order in transaction
    const updated = await prisma.$transaction(async (tx) => {
      const closedAt = newStatus === "FINALIZADA" || newStatus === "CANCELADA" ? new Date() : null;

      const upd = await tx.serviceOrder.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...(internalNotes && { internalNotes }),
          ...(closedAt && { closedAt }),
          history: {
            create: {
              type: "STATUS_CHANGE",
              message: `Status alterado para ${newStatus}`,
              fromStatus: order.status,
              toStatus: newStatus,
              user: { connect: { id: user.id } },
            },
          },
        },
      });

      return upd;
    });

    await audit({
      userId: user.id,
      action: "STATUS_CHANGE",
      entity: "ServiceOrder",
      entityId: orderId,
      data: {
        number: order.number,
        fromStatus: order.status,
        toStatus: newStatus,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/ordens");
    revalidatePath(`/ordens/${orderId}`);

    return { ok: true, id: orderId, message: `Status atualizado para ${newStatus}` };
  } catch (error) {
    console.error("[service-order-update-status]", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível atualizar o status",
    };
  }
}
