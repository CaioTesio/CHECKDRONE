"use client";

import * as React from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

const ToastContext = React.createContext<{
  toast: (message: string, kind?: ToastKind) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const nextId = React.useRef(1);

  const remove = React.useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (message: string, kind: ToastKind = "success") => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, kind, message }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove],
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:bottom-auto sm:top-0 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur",
              "bg-[var(--surface-card)] border-[var(--surface-border)]",
            )}
          >
            <span className="mt-0.5 shrink-0">
              {t.kind === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : t.kind === "error" ? (
                <TriangleAlert className="h-5 w-5 text-red-600" />
              ) : (
                <Info className="h-5 w-5 text-brand-600" />
              )}
            </span>
            <p className="min-w-0 flex-1 text-sm">{t.message}</p>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="shrink-0 rounded-md p-0.5 muted hover:text-[var(--text-strong)]"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>");
  return ctx.toast;
}
