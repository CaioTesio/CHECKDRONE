import { redirect } from "next/navigation";

export default function RootPage() {
  // Redireciona direto para dashboard (sem autenticação)
  redirect("/dashboard");
}
