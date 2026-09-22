"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn, TriangleAlert } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { loginAction, type ActionState } from "@/server/actions/auth";

export function LoginForm() {
  const [state, action] = useActionState<ActionState, FormData>(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="mt-8 space-y-4">
      {state?.error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <Field label="E-mail" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          autoFocus
          placeholder="nome@cftdrones.com.br"
        />
      </Field>

      <Field label="Senha" htmlFor="password" required>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl muted hover:text-[var(--text-strong)]"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      <SubmitButton size="lg" className="w-full justify-center">
        <LogIn className="h-4 w-4" />
        Entrar
      </SubmitButton>
    </form>
  );
}
