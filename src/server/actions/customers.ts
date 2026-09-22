"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { customerSchema } from "@/server/validation";
import { actionError, type FormResult } from "./result";

function parse(formData: FormData) {
  return customerSchema.safeParse({
    name: formData.get("name"),
    docType: formData.get("docType"),
    document: formData.get("document"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    zipCode: formData.get("zipCode"),
    street: formData.get("street"),
    number: formData.get("number"),
    complement: formData.get("complement"),
    district: formData.get("district"),
    city: formData.get("city"),
    state: formData.get("state"),
    notes: formData.get("notes"),
  });
}

export async function createCustomerAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  try {
    const user = await requirePermission("customer:manage");
    const parsed = parse(formData);
    if (!parsed.success) return actionError(parsed.error);

    const customer = await prisma.customer.create({
      data: { ...parsed.data, createdById: user.id },
    });

    await audit({
      userId: user.id,
      action: "CREATE",
      entity: "Customer",
      entityId: customer.id,
      data: { name: customer.name },
    });

    revalidatePath("/clientes");
    return { ok: true, id: customer.id, message: "Cliente cadastrado com sucesso." };
  } catch (error) {
    return handle(error);
  }
}

export async function updateCustomerAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  try {
    const user = await requirePermission("customer:manage");
    const id = String(formData.get("id") ?? "");
    if (!id) return { ok: false, error: "Cliente não informado" };

    const parsed = parse(formData);
    if (!parsed.success) return actionError(parsed.error);

    const before = await prisma.customer.findUnique({ where: { id } });
    if (!before) return { ok: false, error: "Cliente não encontrado" };

    await prisma.customer.update({ where: { id }, data: parsed.data });

    await audit({
      userId: user.id,
      action: "UPDATE",
      entity: "Customer",
      entityId: id,
      data: { before: { name: before.name, document: before.document }, after: parsed.data },
    });

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    return { ok: true, id, message: "Cliente atualizado." };
  } catch (error) {
    return handle(error);
  }
}

function handle(error: unknown): FormResult {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return {
      ok: false,
      error: "Já existe um cliente com este CPF/CNPJ.",
      fieldErrors: { document: "Já existe um cliente com este CPF/CNPJ." },
    };
  }
  console.error("[customers]", error);
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Não foi possível salvar o cliente.",
  };
}
