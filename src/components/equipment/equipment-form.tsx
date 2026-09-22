"use client";

import * as React from "react";
import { useActionState } from "react";
import { Save, TriangleAlert } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { EQUIPMENT_CATEGORIES } from "@/lib/catalog";
import type { FormResult } from "@/server/actions/result";

export type ModelOption = { id: string; category: string; brand: string; name: string };

export type EquipmentFormValues = {
  id?: string;
  customerId: string;
  category: string;
  brand: string | null;
  model: string;
  serialNumber: string | null;
  assetTag: string | null;
  notes: string | null;
};

export function EquipmentForm({
  action,
  equipment,
  customers,
  models,
  lockCustomer = false,
  onSuccess,
  submitLabel = "Salvar equipamento",
}: {
  action: (prev: FormResult, formData: FormData) => Promise<FormResult>;
  equipment?: EquipmentFormValues;
  customers: { id: string; name: string }[];
  models: ModelOption[];
  lockCustomer?: boolean;
  onSuccess?: (result: { id?: string; message?: string }) => void;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<FormResult, FormData>(action, null);
  const [category, setCategory] = React.useState(equipment?.category ?? EQUIPMENT_CATEGORIES[0]);
  const [brand, setBrand] = React.useState(equipment?.brand ?? "DJI");
  const [model, setModel] = React.useState(equipment?.model ?? "");

  const handled = React.useRef<FormResult>(null);
  React.useEffect(() => {
    if (state?.ok && state !== handled.current) {
      handled.current = state;
      onSuccess?.({ id: state.id, message: state.message });
    }
  }, [state, onSuccess]);

  const fieldError = (name: string) =>
    state && !state.ok ? state.fieldErrors?.[name] : undefined;

  const suggestions = models.filter((m) => m.category === category);

  return (
    <form action={formAction} className="space-y-4">
      {equipment?.id ? <input type="hidden" name="id" value={equipment.id} /> : null}

      {state && !state.ok ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {lockCustomer ? (
        <input type="hidden" name="customerId" value={equipment?.customerId ?? ""} />
      ) : (
        <Field label="Cliente" htmlFor="customerId" required error={fieldError("customerId")}>
          <Select id="customerId" name="customerId" defaultValue={equipment?.customerId ?? ""} required>
            <option value="">Selecione o cliente…</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>
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
        <Field label="Marca" htmlFor="brand">
          <Input
            id="brand"
            name="brand"
            value={brand ?? ""}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="DJI"
          />
        </Field>
      </div>

      <Field
        label="Modelo"
        htmlFor="model"
        required
        hint="selecione um modelo cadastrado ou digite outro"
        error={fieldError("model")}
      >
        <Input
          id="model"
          name="model"
          list="equipment-models"
          required
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            const match = suggestions.find((m) => m.name === e.target.value);
            if (match) setBrand(match.brand);
          }}
          placeholder="Ex.: Agras T50"
        />
        <datalist id="equipment-models">
          {suggestions.map((m) => (
            <option key={m.id} value={m.name}>
              {m.brand} {m.name}
            </option>
          ))}
        </datalist>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Número de série" htmlFor="serialNumber">
          <Input
            id="serialNumber"
            name="serialNumber"
            defaultValue={equipment?.serialNumber ?? ""}
            autoCapitalize="characters"
            placeholder="Ex.: 1ZNBJ8G00A1C7K"
          />
        </Field>
        <Field label="Patrimônio" htmlFor="assetTag" hint="se houver">
          <Input id="assetTag" name="assetTag" defaultValue={equipment?.assetTag ?? ""} />
        </Field>
      </div>

      <Field label="Observações" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} defaultValue={equipment?.notes ?? ""} />
      </Field>

      <div className="flex justify-end pt-1">
        <SubmitButton>
          <Save className="h-4 w-4" />
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
