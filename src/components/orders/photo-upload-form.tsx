"use client";

import * as React from "react";
import { useActionState } from "react";
import { Upload, X, TriangleAlert } from "lucide-react";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { uploadServiceOrderPhotoAction } from "@/server/actions/service-order-photos";
import type { FormResult } from "@/server/actions/result";

const PHOTO_CATEGORIES = [
  "Avaria",
  "Placa de circuito",
  "Conectores",
  "Documentação",
  "Antes",
  "Depois",
  "Outro",
];

export function PhotoUploadForm({ orderId }: { orderId: string }) {
  const [state, formAction] = useActionState<FormResult, FormData>(
    async (prev, formData) => {
      const category = formData.get("category");
      const description = formData.get("description") || null;
      const fileInput = formData.get("file") as File;

      if (!fileInput || fileInput.size === 0) {
        return { ok: false, error: "Selecione um arquivo" };
      }

      if (!category) {
        return { ok: false, error: "Selecione uma categoria" };
      }

      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(fileInput.type)) {
        return { ok: false, error: "Tipo de arquivo não permitido. Use JPEG, PNG ou WebP." };
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (fileInput.size > maxSize) {
        return { ok: false, error: "Arquivo muito grande (máximo 5MB)" };
      }

      const buffer = await fileInput.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      const data = {
        orderId,
        category: String(category),
        description: description ? String(description) : undefined,
        base64,
        filename: fileInput.name,
        mimeType: fileInput.type,
        size: fileInput.size,
      };

      const actionFormData = new FormData();
      actionFormData.set("data", JSON.stringify(data));
      return uploadServiceOrderPhotoAction(prev, actionFormData);
    },
    null,
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    if (state?.ok) {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [state?.ok]);

  const fieldError = (name: string) =>
    state && !state.ok ? state.fieldErrors?.[name] : undefined;

  return (
    <div className="space-y-4">
      {state && !state.ok ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoria" htmlFor="category" required error={fieldError("category")}>
            <Select id="category" name="category" required>
              <option value="">Selecione…</option>
              {PHOTO_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Arquivo (máx. 5MB)" htmlFor="file" required error={fieldError("file")}>
            <div className="relative">
              <input
                ref={fileInputRef}
                id="file"
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
                required
              />
              <div className="flex items-center gap-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-secondary)] px-3 py-2 text-sm">
                <Upload className="h-4 w-4 text-muted" />
                <span className="text-muted">
                  {selectedFile ? selectedFile.name : "Clique para selecionar…"}
                </span>
              </div>
            </div>
          </Field>
        </div>

        <Field label="Descrição" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            placeholder="Informações adicionais sobre a foto"
            rows={2}
            maxLength={500}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Enviar Foto
          </Button>
        </div>
      </form>
    </div>
  );
}
