import * as React from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-3.5 py-2.5 text-sm " +
  "placeholder:text-ink-400 transition-colors focus-ring focus-visible:border-brand-500 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export function Label({
  children,
  htmlFor,
  required,
  hint,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline gap-1.5 text-sm font-medium">
      <span>{children}</span>
      {required ? <span className="text-red-500">*</span> : null}
      {hint ? <span className="text-xs font-normal muted">{hint}</span> : null}
    </label>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(CONTROL, "h-11", className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(CONTROL, "resize-y", className)} {...props} />;
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(CONTROL, "h-11 appearance-none bg-no-repeat pr-9", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236c7a92' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 0.6rem center",
        backgroundSize: "1.1rem",
      }}
      {...props}
    >
      {children}
    </select>
  );
});

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{children}</p>;
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} required={required} hint={hint}>
        {label}
      </Label>
      {children}
      <FieldError>{error}</FieldError>
    </div>
  );
}
