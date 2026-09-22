"use client";

import * as React from "react";
import { useActionState } from "react";
import { Save, TriangleAlert } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { EQUIPMENT_CATEGORIES } from "@/lib/catalog";
import { createEquipmentAction, updateEquipmentAction } from "@/server/actions/equipment";
import type { FormResult } from "@/server/actions/result";

export type EquipmentFormValues = {
  id?: string;
  customerId: string | null;
  category?: string | null;
  brand: string | null;
  model: string;
  serialNumber?: string | null;
  assetTag?: string | null;
  notes?: string | null;
};

export function EquipmentForm({
  initialData,
  initialCustomer,
  onSuccess,
  submitLabel,
}: {
  initialData?: EquipmentFormValues;
  initialCustomer?: { id: string; name: string } | null;
  onSuccess?: (id: string) => void;
  submitLabel?: string;
} = {}) {
  const isEdit = !!initialData?.id;
  const action = isEdit ? updateEquipmentAction : createEquipmentAction;
  const [state, formAction] = useActionState<FormResult, FormData>(action, null);
  const [category, setCategory] = React.useState(initialData?.category ?? EQUIPMENT_CATEGORIES[0]);

  const handled = React.useRef<FormResult>(null);
  React.useEffect(() => {
    if (state?.ok && state !== handled.current) {
      handled.current = state;
      onSuccess?.(state.id!);
    }
  }, [state, onSuccess]);

  const fieldError = (name: string) =>
    state && !state.ok ? state.fieldErrors?.[name] : undefined;

  return (
    <form action={formAction} className="space-y-4">
      {initialData?.id ? <input type="hidden" name="id" value={initialData.id} /> : null}

      {state && !state.ok ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {initialCustomer ? (
        <div>
          <input type="hidden" name="customerId" value={initialCustomer.id} />
          <Field label="Cliente">
            <div className="px-3 py-2 text-sm">{initialCustomer.name}</div>
          </Field>
        </div>
      ) : (
        <Field label="Cliente" htmlFor="customerId" required error={fieldError("customerId")}>
          <Input
            id="customerId"
            name="customerId"
            defaultValue={initialData?.customerId ?? ""}
            placeholder="ID do cliente"
            required
          />
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Categoria" htmlFor="category" required>
          <Select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {EQUIPMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Marca" htmlFor="brand" required error={fieldError("brand")}>
          <Input
            id="brand"
            name="brand"
            defaultValue={initialData?.brand ?? "DJI"}
            placeholder="Ex.: DJI"
            required
          />
        </Field>
      </div>

      <Field
        label="Modelo"
        htmlFor="model"
        required
        error={fieldError("model")}
      >
        <Input
          id="model"
          name="model"
          defaultValue={initialData?.model ?? ""}
          placeholder="Ex.: Agras T50"
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Número de série" htmlFor="serialNumber">
          <Input
            id="serialNumber"
            name="serialNumber"
            defaultValue={initialData?.serialNumber ?? ""}
            autoCapitalize="characters"
            placeholder="Ex.: 1ZNBJ8G00A1C7K"
          />
        </Field>
        <Field label="Patrimônio" htmlFor="assetTag" hint="se houver">
          <Input id="assetTag" name="assetTag" defaultValue={initialData?.assetTag ?? ""} />
        </Field>
      </div>

      <Field label="Observações" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} defaultValue={initialData?.notes ?? ""} />
      </Field>

      <div className="flex justify-end pt-1">
        <SubmitButton>
          <Save className="h-4 w-4" />
          {submitLabel ?? (isEdit ? "Atualizar equipamento" : "Cadastrar equipamento")}
        </SubmitButton>
      </div>
    </form>
  );
}
