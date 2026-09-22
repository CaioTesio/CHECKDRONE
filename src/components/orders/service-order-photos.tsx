"use client";

import * as React from "react";
import { useActionState } from "react";
import Image from "next/image";
import { Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteServiceOrderPhotoAction } from "@/server/actions/service-order-photos";
import type { FormResult } from "@/server/actions/result";

type Photo = {
  id: string;
  storageKey: string;
  category: string;
  description: string | null;
  uploadedBy: { name: string | null };
  createdAt: Date;
};

export function ServiceOrderPhotos({ photos }: { photos: Photo[] }) {
  const [deletingIds, setDeletingIds] = React.useState<Set<string>>(new Set());

  const handleDeletePhoto = async (photoId: string) => {
    setDeletingIds((prev) => new Set([...prev, photoId]));

    const formData = new FormData();
    formData.set("photoId", photoId);

    try {
      await deleteServiceOrderPhotoAction(null, formData);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
    } catch (error) {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
    }
  };

  if (photos.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Nenhuma foto enviada ainda</span>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="group relative overflow-hidden rounded-lg border border-[var(--surface-border)] bg-[var(--surface-secondary)]"
        >
          <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              src={`/api/photos/${photo.storageKey}`}
              alt={photo.category}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleDeletePhoto(photo.id)}
              disabled={deletingIds.has(photo.id)}
              className="self-end rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 p-1.5 text-white transition-colors"
              aria-label="Deletar foto"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3 space-y-1">
            <p className="font-medium text-sm">{photo.category}</p>
            {photo.description && (
              <p className="text-xs text-muted line-clamp-2">{photo.description}</p>
            )}
            <p className="text-xs text-muted">
              {photo.uploadedBy?.name} · {new Date(photo.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
