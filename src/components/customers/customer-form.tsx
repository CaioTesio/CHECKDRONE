"use client";

import * as React from "react";
import { useActionState } from "react";
import { Save, TriangleAlert } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { onlyDigits } from "@/lib/format";
import type { FormResult } from "@/server/actions/result";

export type CustomerFormValues = {
  id?: string;
  name: string;
  docType: string;
  document: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
};

function maskDocument(value: string, docType: string): string {
  const d = onlyDigits(value).slice(0, docType === "CNPJ" ? 14 : 11);
  if (docType === "CNPJ") {
    return d
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function maskZip(value: string): string {
  return onlyDigits(value).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

export function CustomerForm({
  action,
  customer,
  onSuccess,
  submitLabel = "Salvar cliente",
  compact = false,
}: {
  action: (prev: FormResult, formData: FormData) => Promise<FormResult>;
  customer?: CustomerFormValues;
  onSuccess?: (result: { id?: string; message?: string }) => void;
  submitLabel?: string;
  compact?: boolean;
}) {
  const [state, formAction] = useActionState<FormResult, FormData>(action, null);
  const [docType, setDocType] = React.useState(customer?.docType ?? "CPF");
  const [document, setDocument] = React.useState(
    customer?.document ? maskDocument(customer.document, customer.docType) : "",
  );
  const [phone, setPhone] = React.useState(maskPhone(customer?.phone ?? ""));
  const [whatsapp, setWhatsapp] = React.useState(maskPhone(customer?.whatsapp ?? ""));
  const [sameAsPhone, setSameAsPhone] = React.useState(
    !customer || onlyDigits(customer.phone ?? "") === onlyDigits(customer.whatsapp ?? ""),
  );
  const [zipCode, setZipCode] = React.useState(maskZip(customer?.zipCode ?? ""));

  const handled = React.useRef<FormResult>(null);
  React.useEffect(() => {
    if (state?.ok && state !== handled.current) {
      handled.current = state;
      onSuccess?.({ id: state.id, message: state.message });
    }
  }, [state, onSuccess]);

  const fieldError = (name: string) =>
    state && !state.ok ? state.fieldErrors?.[name] : undefined;

  return (
    <form action={formAction} className="space-y-4">
      {customer?.id ? <input type="hidden" name="id" value={customer.id} /> : null}
      <input type="hidden" name="whatsapp" value={sameAsPhone ? phone : whatsapp} />

      {state && !state.ok ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <Field
        label="Nome completo / Razão social"
        htmlFor="name"
        required
        error={fieldError("name")}
      >
        <Input
          id="name"
          name="name"
          required
          defaultValue={customer?.name ?? ""}
          placeholder="Ex.: Fazenda Santa Helena Agropecuária LTDA"
          autoComplete="off"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
        <Field label="Tipo" htmlFor="docType">
          <Select
            id="docType"
            name="docType"
            value={docType}
            onChange={(e) => {
              setDocType(e.target.value);
              setDocument((d) => maskDocument(d, e.target.value));
            }}
          >
            <option value="CPF">CPF</option>
            <option value="CNPJ">CNPJ</option>
          </Select>
        </Field>
        <Field label="CPF / CNPJ" htmlFor="document" error={fieldError("document")}>
          <Input
            id="document"
            name="document"
            inputMode="numeric"
            value={document}
            onChange={(e) => setDocument(maskDocument(e.target.value, docType))}
            placeholder={docType === "CNPJ" ? "00.000.000/0000-00" : "000.000.000-00"}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefone" htmlFor="phone" error={fieldError("phone")}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            placeholder="(67) 99999-0000"
          />
        </Field>
        <div>
          <Field label="WhatsApp" htmlFor="whatsappInput" error={fieldError("whatsapp")}>
            <Input
              id="whatsappInput"
              type="tel"
              inputMode="tel"
              value={sameAsPhone ? phone : whatsapp}
              disabled={sameAsPhone}
              onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
              placeholder="(67) 99999-0000"
            />
          </Field>
          <label className="mt-2 flex items-center gap-2 text-sm muted">
            <input
              type="checkbox"
              checked={sameAsPhone}
              onChange={(e) => setSameAsPhone(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--surface-border)] accent-[var(--color-brand-600)]"
            />
            Mesmo número do telefone
          </label>
        </div>
      </div>

      <Field label="E-mail" htmlFor="email" error={fieldError("email")}>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          defaultValue={customer?.email ?? ""}
          placeholder="contato@empresa.com.br"
        />
      </Field>

      {!compact ? (
        <fieldset className="space-y-4 rounded-xl border border-[var(--surface-border)] p-4">
          <legend className="px-1 text-sm font-medium">Endereço</legend>
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <Field label="CEP" htmlFor="zipCode">
              <Input
                id="zipCode"
                name="zipCode"
                inputMode="numeric"
                value={zipCode}
                onChange={(e) => setZipCode(maskZip(e.target.value))}
                placeholder="79000-000"
              />
            </Field>
            <Field label="Logradouro" htmlFor="street">
              <Input id="street" name="street" defaultValue={customer?.street ?? ""} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Número" htmlFor="number">
              <Input id="number" name="number" defaultValue={customer?.number ?? ""} />
            </Field>
            <Field label="Complemento" htmlFor="complement">
              <Input id="complement" name="complement" defaultValue={customer?.complement ?? ""} />
            </Field>
            <Field label="Bairro" htmlFor="district">
              <Input id="district" name="district" defaultValue={customer?.district ?? ""} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <Field label="Cidade" htmlFor="city">
              <Input id="city" name="city" defaultValue={customer?.city ?? ""} />
            </Field>
            <Field label="UF" htmlFor="state">
              <Input
                id="state"
                name="state"
                maxLength={2}
                defaultValue={customer?.state ?? ""}
                onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
                placeholder="MS"
              />
            </Field>
          </div>
        </fieldset>
      ) : (
        <>
          <input type="hidden" name="zipCode" value={zipCode} />
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <Field label="Cidade" htmlFor="city">
              <Input id="city" name="city" defaultValue={customer?.city ?? ""} />
            </Field>
            <Field label="UF" htmlFor="state">
              <Input id="state" name="state" maxLength={2} defaultValue={customer?.state ?? ""} />
            </Field>
          </div>
        </>
      )}

      <Field label="Observações" htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={customer?.notes ?? ""}
          placeholder="Informações internas sobre o cliente (opcional)"
        />
      </Field>

      <div className="flex justify-end gap-2 pt-1">
        <SubmitButton size="md">
          <Save className="h-4 w-4" />
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
