import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell user={user} logout={async () => { "use server"; }}>
      {children}
    </AppShell>
  );
}
