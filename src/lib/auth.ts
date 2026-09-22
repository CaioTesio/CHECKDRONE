import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { prisma } from "./db";
import { can, type Permission, type Role } from "./roles";

const COOKIE_NAME = "cft_session";
const SESSION_HOURS = 12;

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "AUTH_SECRET ausente ou muito curto. Defina-o no .env (openssl rand -base64 32).",
    );
  }
  return new TextEncoder().encode(value);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type JwtPayload = {
  sub: string;
  name: string;
  email: string;
  role: Role;
  v: number;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  tokenVersion: number;
}): Promise<void> {
  const expires = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  const token = await new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
    v: user.tokenVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Lê a sessão do cookie e confere que o usuário continua ativo e com a
 * mesma versão de token (senha não trocada / acesso não revogado).
 * `cache` garante uma única consulta por request.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify<JwtPayload>(token, secret(), {
      algorithms: ["HS256"],
    });
    const user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
      select: { id: true, name: true, email: true, role: true, active: true, tokenVersion: true },
    });
    if (!user || !user.active || user.tokenVersion !== payload.v) return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role as Role };
  } catch {
    return null;
  }
});

export class AuthError extends Error {
  constructor(message = "Não autenticado") {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Você não tem permissão para esta ação") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Uso em Server Actions / Route Handlers: lança se não houver sessão. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new AuthError();
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) throw new ForbiddenError();
  return user;
}
