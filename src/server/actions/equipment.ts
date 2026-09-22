"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { equipmentSchema } from "@/server/validation";
import { actionError, type FormResult } from "./result";

function parse(formData: FormData) {
  return equipmentSchema.safeParse({
    customerId: formData.get("customerId"),
    category: formData.get("category"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    serialNumber: formData.get("serialNumber"),
    assetTag: formData.get("assetTag"),
    notes: formData.get("notes"),
  });
}

export async function createEquipmentAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  try {
    const user = await requirePermission("equipment:create");
    const parsed = parse(formData);
    if (!parsed.success) return actionError(parsed.error);

    const customer = await prisma.customer.findUnique({
      where: { id: parsed.data.customerId },
      select: { id: true },
    });
    if (!customer) return { ok: false, error: "Cliente não encontrado." };

    const equipment = await prisma.equipment.create({
      data: { ...parsed.data, createdById: user.id },
    });

    await audit({
      userId: user.id,
      action: "CREATE",
      entity: "Equipment",
      entityId: equipment.id,
      data: { model: equipment.model, customerId: equipment.customerId },
    });

    revalidatePath("/equipamentos");
    revalidatePath(`/clientes/${equipment.customerId}`);
    return { ok: true, id: equipment.id, message: "Equipamento cadastrado." };
  } catch (error) {
    console.error("[equipment]", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível salvar o equipamento.",
    };
  }
}

export async function updateEquipmentAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  try {
    const user = await requirePermission("equipment:update");
    const id = String(formData.get("id") ?? "");
    if (!id) return { ok: false, error: "Equipamento não informado" };

    const parsed = parse(formData);
    if (!parsed.success) return actionError(parsed.error);

    const existing = await prisma.equipment.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "Equipamento não encontrado." };

    await prisma.equipment.update({ where: { id }, data: parsed.data });

    await audit({
      userId: user.id,
      action: "UPDATE",
      entity: "Equipment",
      entityId: id,
      data: parsed.data,
    });

    revalidatePath("/equipamentos");
    revalidatePath(`/equipamentos/${id}`);
    revalidatePath(`/clientes/${parsed.data.customerId}`);
    return { ok: true, id, message: "Equipamento atualizado." };
  } catch (error) {
    console.error("[equipment]", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível salvar o equipamento.",
    };
  }
}
