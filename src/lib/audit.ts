import "server-only";
import { prisma } from "./db";

type AuditInput = {
  userId?: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "STATUS_CHANGE";
  entity: string;
  entityId?: string | null;
  data?: unknown;
  ip?: string | null;
};

/** Registro de alterações. Nunca deve quebrar a operação principal. */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        data: input.data === undefined ? null : JSON.stringify(input.data),
        ip: input.ip ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] falha ao registrar log:", error);
  }
}
