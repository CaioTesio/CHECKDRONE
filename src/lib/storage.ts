import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.env.STORAGE_DIR ?? "./storage/uploads");

export const MAX_PHOTO_BYTES = 12 * 1024 * 1024; // 12 MB
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Impede path traversal: a chave é sempre gerada por nós e revalidada na leitura. */
function resolveKey(key: string): string {
  const full = path.resolve(ROOT, key);
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) {
    throw new Error("Chave de arquivo inválida");
  }
  return full;
}

export async function savePhoto(
  buffer: Buffer,
  mimeType: string,
): Promise<{ key: string; size: number }> {
  if (!ALLOWED_PHOTO_TYPES.includes(mimeType)) {
    throw new Error("Formato de imagem não suportado");
  }
  if (buffer.byteLength > MAX_PHOTO_BYTES) {
    throw new Error("Imagem maior que 12 MB");
  }
  if (!looksLikeImage(buffer, mimeType)) {
    throw new Error("Arquivo enviado não é uma imagem válida");
  }

  const now = new Date();
  const dir = path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
  const name = `${randomUUID()}.${EXTENSIONS[mimeType]}`;
  const key = path.join(dir, name);

  const full = resolveKey(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer);

  return { key, size: buffer.byteLength };
}

export async function readPhoto(key: string): Promise<Buffer> {
  return readFile(resolveKey(key));
}

export async function deletePhoto(key: string): Promise<void> {
  try {
    await unlink(resolveKey(key));
  } catch {
    /* arquivo já removido */
  }
}

export function etagFor(key: string): string {
  return `"${createHash("sha1").update(key).digest("hex")}"`;
}

/** Confere a assinatura binária — não confia no content-type enviado pelo cliente. */
function looksLikeImage(buffer: Buffer, mimeType: string): boolean {
  if (buffer.byteLength < 12) return false;
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8;
  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimeType === "image/webp") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}
