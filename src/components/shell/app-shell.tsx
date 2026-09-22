"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Plus, X } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ROLE_LABELS, can, type Role } from "@/lib/roles";
import { initials } from "@/lib/format";
import { NAV_ITEMS } from "./nav-items";
import { GlobalSearch } from "./global-search";

type ShellUser = { id: string; name: string; email: string; role: Role };

export function AppShell({
  user,
  logout,
  children,
}: {
  user: ShellUser;
  logout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const items = NAV_ITEMS.filter((item) => can(user.role, item.permission));
  const mobileItems = items.filter((item) => item.mobile).slice(0, 4);
  const canCreate = can(user.role, "os:create");

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <div className="flex h-full flex-col gap-1 px-3 py-4">
      <div className="mb-4 flex items-center justify-between px-2">
        <BrandMark />
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          aria-label="Fechar menu"
          className="rounded-lg p-1.5 muted hover:bg-ink-100 lg:hidden dark:hover:bg-ink-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {canCreate ? (
        <Link href="/ordens/nova" className="mb-3">
          <Button className="w-full justify-center" size="md">
            <Plus className="h-4 w-4" />
            Nova Ordem de Serviço
          </Button>
        </Link>
      ) : null}

      <nav className="flex-1 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                  : "muted hover:bg-ink-100 hover:text-[var(--text-strong)] dark:hover:bg-ink-800/60",
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2 border-t border-[var(--surface-border)] pt-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs muted">{ROLE_LABELS[user.role]}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sair"
              title="Sair"
              className="rounded-lg p-2 muted hover:bg-ink-100 hover:text-red-600 dark:hover:bg-ink-800"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh">
      {/* Sidebar fixa — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[var(--surface-border)] bg-[var(--surface-card)] lg:block">
        {sidebar}
      </aside>

      {/* Drawer — mobile/tablet */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/50"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-[17rem] max-w-[85vw] border-r border-[var(--surface-border)] bg-[var(--surface-card)] shadow-2xl">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-[var(--surface-border)] bg-[var(--surface-card)]/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
              className="-ml-1 rounded-lg p-2 muted hover:bg-ink-100 lg:hidden dark:hover:bg-ink-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <BrandMark subtitle={null} />
            </div>
            <div className="ml-auto w-full max-w-md lg:ml-0">
              <GlobalSearch />
            </div>
            {canCreate ? (
              <Link href="/ordens/nova" className="hidden sm:block">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Nova O.S.
                </Button>
              </Link>
            ) : null}
          </div>
        </header>

        <main className="px-4 pb-24 pt-5 sm:px-6 lg:pb-10">{children}</main>
      </div>

      {/* Navegação inferior — celular */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--surface-border)] bg-[var(--surface-card)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${mobileItems.length + (canCreate ? 1 : 0)}, minmax(0, 1fr))` }}
        >
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-brand-600 dark:text-brand-400" : "muted",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.shortLabel}
              </Link>
            );
          })}
          {canCreate ? (
            <Link
              href="/ordens/nova"
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-brand-600 dark:text-brand-400"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                <Plus className="h-3.5 w-3.5" />
              </span>
              Nova O.S.
            </Link>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
