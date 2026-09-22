"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { createSession, destroySession, getSession, verifyPassword } from "@/lib/auth";

export type ActionState = { error?: string; success?: string } | null;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe a senha"),
});

async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const ok = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;

  // Mensagem genérica: não revela se o e-mail existe.
  if (!user || !ok || !user.active) {
    await audit({
      action: "LOGIN",
      entity: "User",
      entityId: user?.id ?? null,
      data: { email: parsed.data.email, result: "FAILED" },
      ip: await clientIp(),
    });
    return { error: "E-mail ou senha incorretos." };
  }

  await createSession(user);
  await audit({
    userId: user.id,
    action: "LOGIN",
    entity: "User",
    entityId: user.id,
    data: { result: "OK" },
    ip: await clientIp(),
  });

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    await audit({ userId: session.id, action: "LOGOUT", entity: "User", entityId: session.id });
  }
  await destroySession();
  redirect("/login");
}
