"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { buildWhatsAppLink, buildWhatsAppMessage, publicOrderUrl } from "@/lib/whatsapp";
import { actionError, type FormResult } from "./result";
import { z } from "zod";

const shareSchema = z.object({
  orderId: z.string().cuid(),
  message: z.string().optional(),
});

export async function shareOrderViaWhatsAppAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  try {
    const user = await requirePermission("os:addNote");

    const dataStr = formData.get("data");
    if (!dataStr) return { ok: false, error: "Dados não fornecidos" };

    let parsed;
    try {
      const data = JSON.parse(String(dataStr)) as unknown;
      parsed = shareSchema.safeParse(data);
    } catch {
      return { ok: false, error: "Dados inválidos" };
    }

    if (!parsed.success) return actionError(parsed.error);

    const { orderId, message } = parsed.data;

    // Verify order exists and get details
    const order = await prisma.serviceOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        number: true,
        publicToken: true,
        status: true,
        customer: {
          select: {
            name: true,
            phone: true,
            whatsapp: true,
          },
        },
      },
    });

    if (!order) return { ok: false, error: "Ordem de serviço não encontrada" };

    if (!order.customer.phone && !order.customer.whatsapp) {
      return { ok: false, error: "Cliente não possui número de telefone registrado" };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const whatsappLink = buildWhatsAppLink(
      {
        number: order.number,
        publicToken: order.publicToken,
        customer: order.customer,
        entryAt: new Date(),
        maintenanceType: "",
        items: [],
        equipment: { model: "" },
      },
      baseUrl,
    );

    if (!whatsappLink) {
      return { ok: false, error: "Não foi possível gerar o link do WhatsApp" };
    }

    // Create history entry
    await prisma.serviceOrderHistory.create({
      data: {
        serviceOrderId: orderId,
        type: "WHATSAPP_SENT",
        message: message || "Link compartilhado via WhatsApp",
        isPublic: false,
        userId: user.id,
      },
    });

    await audit({
      userId: user.id,
      action: "CREATE",
      entity: "ServiceOrderWhatsApp",
      entityId: orderId,
      data: {
        orderNumber: order.number,
        customerPhone: order.customer.phone,
      },
    });

    revalidatePath(`/ordens/${orderId}`);

    return { ok: true, id: orderId, message: "Link do WhatsApp gerado com sucesso" };
  } catch (error) {
    console.error("[service-order-whatsapp-share]", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível gerar o link",
    };
  }
}
