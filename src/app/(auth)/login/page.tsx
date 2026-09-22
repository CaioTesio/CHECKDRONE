import { redirect } from "next/navigation";

export default function LoginPage() {
  // Sistema sem autenticação - redireciona direto para dashboard
  redirect("/dashboard");
}
