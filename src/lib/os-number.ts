import { randomBytes } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";

export function formatOsNumber(year: number, seq: number): string {
  return `OS-${year}-${String(seq).padStart(6, "0")}`;
}

/** Token do link público: 128 bits em base32-ish, sem caracteres ambíguos. */
export function generatePublicToken(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(16);
  let out = "";
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}

/**
 * Próximo sequencial do ano. Chamado dentro da transação de criação —
 * a constraint @@unique([year, seq]) garante que uma corrida falhe em vez
 * de gerar número duplicado (o chamador repete a tentativa).
 */
export async function nextSequence(
  tx: Prisma.TransactionClient,
  year: number,
): Promise<number> {
  const last = await tx.serviceOrder.findFirst({
    where: { year },
    orderBy: { seq: "desc" },
    select: { seq: true },
  });
  return (last?.seq ?? 0) + 1;
}
