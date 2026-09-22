import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/server/actions/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <AppShell user={user} logout={logoutAction}>
      {children}
    </AppShell>
  );
}
