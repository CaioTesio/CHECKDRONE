import { cn } from "@/lib/cn";

/** Marca CFT Drones — rotor quadricóptero estilizado. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("h-8 w-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-brand-600" />
      <g stroke="white" strokeWidth="1.7" strokeLinecap="round">
        <circle cx="10.5" cy="10.5" r="3.1" opacity="0.95" />
        <circle cx="21.5" cy="10.5" r="3.1" opacity="0.95" />
        <circle cx="10.5" cy="21.5" r="3.1" opacity="0.95" />
        <circle cx="21.5" cy="21.5" r="3.1" opacity="0.95" />
        <path d="M12.7 12.7 14.6 14.6M19.3 12.7 17.4 14.6M12.7 19.3 14.6 17.4M19.3 19.3 17.4 17.4" />
      </g>
      <rect x="13.4" y="13.4" width="5.2" height="5.2" rx="1.6" fill="white" />
    </svg>
  );
}

export function BrandMark({
  className,
  subtitle = "Ordens de Serviço",
}: {
  className?: string;
  subtitle?: string | null;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Logo />
      <div className="leading-tight">
        <p className="text-[15px] font-semibold tracking-tight">CFT Drones</p>
        {subtitle ? <p className="text-[11px] uppercase tracking-wide muted">{subtitle}</p> : null}
      </div>
    </div>
  );
}
