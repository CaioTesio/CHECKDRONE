"use server";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

type MotorStatus = {
  number: number;
  status: string;
  notes?: string;
};

type ReplacedPart = {
  partName: string;
  description?: string;
  quantity: number;
};

export async function createExitReportAction(
  _prev: unknown,
  formData: FormData,
) {
  try {
    const user = await requirePermission("os:addNote");

    const serviceOrderId = formData.get("serviceOrderId") as string;
    const replacedPartsStr = formData.get("replacedParts") as string;
    const motorStatusStr = formData.get("motorStatus") as string;
    const finalNotes = formData.get("finalNotes") as string;
    const issuesFound = formData.get("issuesFound") as string;

    if (!serviceOrderId) {
      return { ok: false, error: "ID da ordem de serviço não fornecido" };
    }

    const replacedParts: ReplacedPart[] = JSON.parse(replacedPartsStr || "[]");
    const motorStatus: MotorStatus[] = JSON.parse(motorStatusStr || "[]");

    // Verificar se ordem existe
    const order = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      select: { id: true, number: true, customerId: true },
    });

    if (!order) {
      return { ok: false, error: "Ordem de serviço não encontrada" };
    }

    // Criar relatório de saída
    const exitReport = await prisma.serviceOrderExitReport.create({
      data: {
        serviceOrderId,
        completedAt: new Date(),
        finalNotes: finalNotes || null,
        issuesFound: issuesFound ? JSON.stringify(issuesFound) : null,
        createdById: user.id,
        replacedParts: {
          create: replacedParts.map((part) => ({
            partName: part.partName,
            description: part.description || null,
            quantity: part.quantity,
          })),
        },
        motorStatus: {
          create: motorStatus.map((motor) => ({
            motorNumber: motor.number,
            status: motor.status,
            notes: motor.notes || null,
          })),
        },
      },
    });

    // Registrar no histórico
    await prisma.serviceOrderHistory.create({
      data: {
        serviceOrderId,
        type: "UPDATED",
        message: "Relatório de saída finalizado",
        isPublic: true,
        userId: user.id,
      },
    });

    // Audit log
    await audit({
      userId: user.id,
      action: "CREATE",
      entity: "ServiceOrderExitReport",
      entityId: exitReport.id,
      data: {
        orderNumber: order.number,
        replacedPartsCount: replacedParts.length,
        motorIssuesCount: motorStatus.filter(
          (m) => m.status !== "OK",
        ).length,
      },
    });

    revalidatePath(`/ordens/${serviceOrderId}`);

    return { ok: true, reportId: exitReport.id };
  } catch (error) {
    console.error("[createExitReport]", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao criar relatório",
    };
  }
}

export async function getExitReportForDownload(reportId: string) {
  try {
    const report = await prisma.serviceOrderExitReport.findUnique({
      where: { id: reportId },
      include: {
        serviceOrder: {
          include: {
            customer: true,
            equipment: true,
          },
        },
        replacedParts: {
          orderBy: { sortOrder: "asc" },
        },
        motorStatus: {
          orderBy: { motorNumber: "asc" },
        },
        createdBy: true,
      },
    });

    if (!report) {
      throw new Error("Relatório não encontrado");
    }

    return {
      ok: true,
      report,
    };
  } catch (error) {
    console.error("[getExitReportForDownload]", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao buscar relatório",
    };
  }
}
