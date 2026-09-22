"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { generateOsNumber, nextSequence } from "@/lib/os-number";
import { createOrderSchema, type CreateOrderInput } from "@/server/validation";
import { actionError, type FormResult } from "./result";

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

    // Generate order number
    const sequence = await nextSequence();
    const number = generateOsNumber(sequence);

    // Create service order with all related data
    const serviceOrder = await prisma.serviceOrder.create({
      data: {
        number,
        customerId,
        equipmentId,
        entryAt,
        status: "RECEBIDA",
        maintenanceType,
        maintenanceTypeOther: rest.maintenanceTypeOther,
        customerReport: rest.customerReport,
        requestedService: rest.requestedService,
        entryNotes: rest.entryNotes,
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
        photos: photos.length
          ? {
              create: photos.map((photo) => ({
                photoId: photo.id,
                category: photo.category,
                description: photo.description,
                uploadedById: user.id,
              })),
            }
          : undefined,
        history: {
          create: {
            status: "RECEBIDA",
            changedAt: new Date(),
            changedById: user.id,
          },
        },
      },
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
