"use client";

import * as React from "react";
import { useActionState } from "react";
import { Save, TriangleAlert } from "lucide-react";
import { Field, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { STATUS_LIST, type StatusCode } from "@/lib/status";
import { updateServiceOrderStatusAction } from "@/server/actions/service-orders";
import type { FormResult } from "@/server/actions/result";

export function StatusChangeForm({
  orderId,
  currentStatus,
  onSuccess,
}: {
  orderId: string;
  currentStatus: string;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState<FormResult, FormData>(
    async (prev, formData) => {
      const newStatus = formData.get("newStatus");
      const internalNotes = formData.get("internalNotes") || null;

      const data = {
        orderId,
        newStatus: String(newStatus),
        internalNotes: internalNotes ? String(internalNotes) : undefined,
      };

      const formDataForAction = new FormData();
      formDataForAction.set("data", JSON.stringify(data));
      return updateServiceOrderStatusAction(prev, formDataForAction);
    },
    null,
  );

  const fieldError = (name: string) =>
    state && !state.ok ? state.fieldErrors?.[name] : undefined;

  const handled = React.useRef<FormResult>(null);
  React.useEffect(() => {
    if (state?.ok && state !== handled.current) {
      handled.current = state;
      onSuccess?.();
    }
  }, [state, onSuccess]);

  const availableStatuses = STATUS_LIST.filter((s) => s.code !== (currentStatus as StatusCode));

  return (
    <form action={formAction} className="space-y-6">
      {state && !state.ok ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <div className="space-y-4">
        <Field
          label="Novo status"
          htmlFor="newStatus"
          required
          error={fieldError("newStatus")}
        >
          <Select id="newStatus" name="newStatus" required>
            <option value="">Selecione…</option>
            {availableStatuses.map((status) => (
              <option key={status.code} value={status.code}>
                {status.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Notas internas" htmlFor="internalNotes">
          <Textarea
            id="internalNotes"
            name="internalNotes"
            placeholder="Anotações internas sobre esta mudança de status (não visível ao cliente)"
            rows={4}
            maxLength={2000}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <SubmitButton className="gap-2">
          <Save className="h-4 w-4" />
          Alterar Status
        </SubmitButton>
      </div>
    </form>
  );
}
