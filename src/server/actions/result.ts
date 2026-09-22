import type { ZodError } from "zod";

export type FormResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | null;

/** Converte um ZodError em erros por campo, preservando a primeira mensagem. */
export function actionError(error: ZodError): FormResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return {
    ok: false,
    error: error.issues[0]?.message ?? "Verifique os dados informados.",
    fieldErrors,
  };
}
