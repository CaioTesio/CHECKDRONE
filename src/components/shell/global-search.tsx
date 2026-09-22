"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, Plane, Search, User } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";

type SearchResult = {
  orders: { id: string; number: string; status: string; customerName: string; equipment: string }[];
  customers: { id: string; name: string; document: string | null; phone: string | null }[];
  equipment: { id: string; label: string; serialNumber: string | null; customerName: string }[];
};

const EMPTY: SearchResult = { orders: [], customers: [], equipment: [] };

export function GlobalSearch() {
  const router = useRouter();
  const [term, setTerm] = React.useState("");
  const [results, setResults] = React.useState<SearchResult>(EMPTY);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const query = term.trim();
    if (query.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (response.ok) setResults(await response.json());
      } catch {
        /* requisição cancelada */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const total = results.orders.length + results.customers.length + results.equipment.length;
  const showPanel = open && term.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (term.trim()) {
            setOpen(false);
            router.push(`/busca?q=${encodeURIComponent(term.trim())}`);
          }
        }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 muted" />
          <input
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            type="search"
            placeholder="Buscar O.S., cliente, CPF/CNPJ, série…"
            aria-label="Busca global"
            className="h-10 w-full rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] pl-9 pr-3 text-sm focus-ring focus-visible:border-brand-500"
          />
          {loading ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin muted" />
          ) : null}
        </div>
      </form>

      {showPanel ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[65vh] overflow-y-auto rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-1.5 shadow-xl scroll-thin">
          {total === 0 && !loading ? (
            <p className="px-3 py-6 text-center text-sm muted">Nenhum resultado encontrado.</p>
          ) : null}

          <Group title="Ordens de Serviço" show={results.orders.length > 0}>
            {results.orders.map((order) => (
              <Item key={order.id} href={`/ordens/${order.id}`} onNavigate={() => setOpen(false)}>
                <ClipboardList className="h-4 w-4 shrink-0 muted" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{order.number}</span>
                  <span className="block truncate text-xs muted">
                    {order.customerName} · {order.equipment}
                  </span>
                </span>
                <StatusBadge status={order.status} size="sm" />
              </Item>
            ))}
          </Group>

          <Group title="Clientes" show={results.customers.length > 0}>
            {results.customers.map((customer) => (
              <Item key={customer.id} href={`/clientes/${customer.id}`} onNavigate={() => setOpen(false)}>
                <User className="h-4 w-4 shrink-0 muted" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{customer.name}</span>
                  <span className="block truncate text-xs muted">
                    {customer.document ?? "sem documento"}
                  </span>
                </span>
              </Item>
            ))}
          </Group>

          <Group title="Equipamentos" show={results.equipment.length > 0}>
            {results.equipment.map((item) => (
              <Item key={item.id} href={`/equipamentos/${item.id}`} onNavigate={() => setOpen(false)}>
                <Plane className="h-4 w-4 shrink-0 muted" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.label}</span>
                  <span className="block truncate text-xs muted">
                    {item.serialNumber ? `S/N ${item.serialNumber} · ` : ""}
                    {item.customerName}
                  </span>
                </span>
              </Item>
            ))}
          </Group>

          {total > 0 ? (
            <Link
              href={`/busca?q=${encodeURIComponent(term.trim())}`}
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-lg px-3 py-2 text-center text-xs font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10"
            >
              Ver todos os resultados
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Group({
  title,
  show,
  children,
}: {
  title: string;
  show: boolean;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return (
    <div className="mb-1">
      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide muted">
        {title}
      </p>
      {children}
    </div>
  );
}

function Item({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-ink-100 dark:hover:bg-ink-800/60"
    >
      {children}
    </Link>
  );
}
