import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col lg:flex-row">
      {/* Painel de marca — só no desktop */}
      <section className="relative hidden flex-1 overflow-hidden bg-brand-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 15%, rgba(255,255,255,.35), transparent 42%), radial-gradient(circle at 78% 72%, rgba(255,255,255,.22), transparent 45%)",
          }}
        />
        <BrandMark subtitle={null} className="relative [&_p]:text-white" />
        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Gestão de Ordens de Serviço para assistência técnica de drones
          </h1>
          <p className="mt-4 text-brand-100">
            Registre a entrada do equipamento em minutos, documente o estado com fotos e
            mantenha o cliente informado do início ao fim.
          </p>
          <ul className="mt-8 space-y-2.5 text-sm text-brand-100">
            {[
              "Abertura guiada em 6 etapas, do balcão ao celular",
              "Checklist de entrada e registro fotográfico",
              "Link público seguro para acompanhamento do cliente",
              "Histórico completo de cada equipamento",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-brand-200">
          © {new Date().getFullYear()} CFT Drones. Uso restrito a colaboradores autorizados.
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Acessar o sistema</h2>
          <p className="mt-1.5 text-sm muted">
            Entre com suas credenciais para continuar.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
