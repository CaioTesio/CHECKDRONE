"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { actionError, type FormResult } from "./result";
import { z } from "zod";

const STORAGE_DIR = path.join(process.cwd(), ".photos");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMETYPES = ["image/jpeg", "image/png", "image/webp"];

const uploadPhotoSchema = z.object({
  orderId: z.string().cuid(),
  category: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  base64: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive().max(MAX_FILE_SIZE),
});

export async function uploadServiceOrderPhotoAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  try {
    const user = await requirePermission("os:addPhotos");

    const dataStr = formData.get("data");
    if (!dataStr) return { ok: false, error: "Dados não fornecidos" };

    let parsed;
    try {
      const data = JSON.parse(String(dataStr)) as unknown;
      parsed = uploadPhotoSchema.safeParse(data);
    } catch {
      return { ok: false, error: "Dados inválidos" };
    }

    if (!parsed.success) return actionError(parsed.error);

    const { orderId, category, description, base64, filename, mimeType, size } = parsed.data;

    // Validate MIME type
    if (!ALLOWED_MIMETYPES.includes(mimeType)) {
      return { ok: false, error: "Tipo de arquivo não permitido. Use JPEG, PNG ou WebP." };
    }

    // Verify service order exists
    const order = await prisma.serviceOrder.findUnique({
      where: { id: orderId },
      select: { id: true, number: true, customerId: true, equipmentId: true },
    });

    if (!order) return { ok: false, error: "Ordem de serviço não encontrada" };

    // Ensure storage directory exists
    await fs.mkdir(STORAGE_DIR, { recursive: true });

    // Generate unique storage key
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const ext = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "webp";
    const storageKey = `${timestamp}-${random}.${ext}`;
    const storagePath = path.join(STORAGE_DIR, storageKey);

    // Validate base64 and save file
    try {
      const buffer = Buffer.from(base64, "base64");
      if (buffer.length > MAX_FILE_SIZE) {
        return { ok: false, error: "Arquivo muito grande" };
      }
      await fs.writeFile(storagePath, buffer);
    } catch (error) {
      console.error("[photo-upload] falha ao salvar arquivo:", error);
      return { ok: false, error: "Não foi possível salvar a foto" };
    }

    // Create photo record in database
    const photo = await prisma.serviceOrderPhoto.create({
      data: {
        serviceOrderId: orderId,
        storageKey,
        mimeType,
        size,
        category,
        description: description || null,
        uploadedById: user.id,
      },
    });

    // Create history entry
    await prisma.serviceOrderHistory.create({
      data: {
        serviceOrderId: orderId,
        type: "PHOTOS_ADDED",
        message: `Foto adicionada: ${category}`,
        userId: user.id,
      },
    });

    await audit({
      userId: user.id,
      action: "CREATE",
      entity: "ServiceOrderPhoto",
      entityId: photo.id,
      data: {
        orderId: orderId,
        orderNumber: order.number,
        category,
        filename,
      },
    });

    revalidatePath(`/ordens/${orderId}`);

    return { ok: true, id: photo.id, message: "Foto enviada com sucesso" };
  } catch (error) {
    console.error("[service-order-photo-upload]", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível fazer upload da foto",
    };
  }
}

export async function deleteServiceOrderPhotoAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  try {
    const user = await requirePermission("os:addPhotos");

    const photoId = formData.get("photoId");
    if (!photoId) return { ok: false, error: "Foto não fornecida" };

    // Get photo record
    const photo = await prisma.serviceOrderPhoto.findUnique({
      where: { id: String(photoId) },
      select: { id: true, storageKey: true, serviceOrderId: true },
    });

    if (!photo) return { ok: false, error: "Foto não encontrada" };

    // Verify order exists
    const order = await prisma.serviceOrder.findUnique({
      where: { id: photo.serviceOrderId },
      select: { id: true, number: true },
    });

    if (!order) return { ok: false, error: "Ordem de serviço não encontrada" };

    // Delete file from storage
    const storagePath = path.join(STORAGE_DIR, photo.storageKey);
    try {
      await fs.unlink(storagePath);
    } catch (error) {
      console.error("[photo-delete] falha ao deletar arquivo:", error);
    }

    // Delete from database
    await prisma.serviceOrderPhoto.delete({
      where: { id: photo.id },
    });

    await audit({
      userId: user.id,
      action: "DELETE",
      entity: "ServiceOrderPhoto",
      entityId: photo.id,
      data: {
        orderId: photo.serviceOrderId,
        orderNumber: order.number,
      },
    });

    revalidatePath(`/ordens/${photo.serviceOrderId}`);

    return { ok: true, id: photo.id, message: "Foto removida com sucesso" };
  } catch (error) {
    console.error("[service-order-photo-delete]", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível remover a foto",
    };
  }
}
