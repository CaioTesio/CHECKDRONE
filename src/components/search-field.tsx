"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

/** Campo de busca que reflete o termo na URL (?q=) com debounce. */
export function SearchField({
  placeholder = "Buscar…",
  defaultValue = "",
  paramName = "q",
}: {
  placeholder?: string;
  defaultValue?: string;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(defaultValue);
  const initial = React.useRef(true);

  React.useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set(paramName, value.trim());
      else params.delete(paramName);
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] pl-9 pr-9 text-sm focus-ring focus-visible:border-brand-500"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 muted hover:text-[var(--text-strong)]"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
