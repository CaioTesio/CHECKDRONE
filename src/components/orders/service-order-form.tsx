"use client";

import * as React from "react";
import { useActionState } from "react";
import { Save, TriangleAlert } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { MAINTENANCE_TYPES } from "@/lib/catalog";
import { createServiceOrderAction } from "@/server/actions/service-orders";
import type { FormResult } from "@/server/actions/result";
import type { CreateOrderInput } from "@/server/validation";

export type ServiceOrderFormValues = Omit<CreateOrderInput, "items" | "photos"> & {
  items: Array<{ label: string; quantity: number; notes?: string; isCustom?: boolean }>;
  photos: Array<{ id: string; category: string; description?: string }>;
};

export function ServiceOrderForm({
  customers,
  equipment,
  onSuccess,
}: {
  customers: Array<{ id: string; name: string }>;
  equipment: Array<{ id: string; customerId: string; brand: string | null; model: string }>;
  onSuccess?: (id: string, number: string) => void;
}) {
  const [state, formAction] = useActionState<FormResult, FormData>(
    async (prev, formData) => {
      const customerId = formData.get("customerId");
      const equipmentId = formData.get("equipmentId");
      const entryAt = formData.get("entryAt");
      const maintenanceType = formData.get("maintenanceType");
      const maintenanceTypeOther = formData.get("maintenanceTypeOther") || null;
      const customerReport = formData.get("customerReport") || null;
      const requestedService = formData.get("requestedService") || null;
      const entryNotes = formData.get("entryNotes") || null;

      const data = {
        customerId: String(customerId),
        equipmentId: String(equipmentId),
        entryAt: new Date(String(entryAt)),
        maintenanceType: String(maintenanceType),
        maintenanceTypeOther: maintenanceTypeOther ? String(maintenanceTypeOther) : null,
        customerReport: customerReport ? String(customerReport) : null,
        requestedService: requestedService ? String(requestedService) : null,
        entryNotes: entryNotes ? String(entryNotes) : null,
        items: [],
        photos: [],
      };

      const formDataForAction = new FormData();
      formDataForAction.set("data", JSON.stringify(data));
      return createServiceOrderAction(prev, formDataForAction);
    },
    null,
  );

  const [customerId, setCustomerId] = React.useState("");
  const [entryAtDateTime, setEntryAtDateTime] = React.useState(
    new Date().toISOString().slice(0, 16),
  );

  const fieldError = (name: string) =>
    state && !state.ok ? state.fieldErrors?.[name] : undefined;

  const equipmentOptions = equipment.filter((e) => e.customerId === customerId);

  const handled = React.useRef<FormResult>(null);
  React.useEffect(() => {
    if (state?.ok && state !== handled.current) {
      handled.current = state;
      onSuccess?.(state.id!, "O.S. criada");
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-6">
      {state && !state.ok ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <div className="space-y-4 border-b border-[var(--surface-border)] pb-6">
        <h3 className="font-semibold">Cliente e Equipamento</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente" htmlFor="customerId" required error={fieldError("customerId")}>
            <Select
              id="customerId"
              name="customerId"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            >
              <option value="">Selecione o cliente…</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Equipamento"
            htmlFor="equipmentId"
            required
            error={fieldError("equipmentId")}
          >
            <Select id="equipmentId" name="equipmentId" required disabled={!customerId}>
              <option value="">Selecione o equipamento…</option>
              {equipmentOptions.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.brand || "S/marca"} {eq.model}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="space-y-4 border-b border-[var(--surface-border)] pb-6">
        <h3 className="font-semibold">Data e Tipo de Manutenção</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Data/hora de entrada"
            htmlFor="entryAt"
            required
            error={fieldError("entryAt")}
          >
            <Input
              id="entryAt"
              name="entryAt"
              type="datetime-local"
              value={entryAtDateTime}
              onChange={(e) => setEntryAtDateTime(e.target.value)}
              required
            />
          </Field>
          <Field
            label="Tipo de manutenção"
            htmlFor="maintenanceType"
            required
            error={fieldError("maintenanceType")}
          >
            <Select id="maintenanceType" name="maintenanceType" required>
              <option value="">Selecione…</option>
              {MAINTENANCE_TYPES.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Outra manutenção" htmlFor="maintenanceTypeOther">
          <Input
            id="maintenanceTypeOther"
            name="maintenanceTypeOther"
            placeholder="Se selecionou 'Outro'"
            maxLength={80}
          />
        </Field>
      </div>

      <div className="space-y-4 border-b border-[var(--surface-border)] pb-6">
        <h3 className="font-semibold">Relatório de Entrada</h3>
        <Field label="Relato do cliente" htmlFor="customerReport">
          <Textarea
            id="customerReport"
            name="customerReport"
            placeholder="O que o cliente informou sobre o problema?"
            rows={3}
            maxLength={4000}
          />
        </Field>
        <Field label="Serviço solicitado" htmlFor="requestedService">
          <Textarea
            id="requestedService"
            name="requestedService"
            placeholder="Qual é o serviço que o cliente está solicitando?"
            rows={3}
            maxLength={4000}
          />
        </Field>
        <Field label="Observações de entrada" htmlFor="entryNotes">
          <Textarea
            id="entryNotes"
            name="entryNotes"
            placeholder="Anotações gerais sobre o equipamento no recebimento"
            rows={3}
            maxLength={4000}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <SubmitButton className="gap-2">
          <Save className="h-4 w-4" />
          Criar Ordem de Serviço
        </SubmitButton>
      </div>
    </form>
  );
}
