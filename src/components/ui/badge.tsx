import { cn } from "@/lib/cn";
import { STATUS_BADGE_CLASSES, STATUS_DOT_CLASSES, statusColor, statusLabel } from "@/lib/status";

export function StatusBadge({
  status,
  size = "md",
  className,
}: {
  status: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const color = statusColor(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        STATUS_BADGE_CLASSES[color],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT_CLASSES[color])} />
      {statusLabel(status)}
    </span>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-700 dark:bg-ink-800 dark:text-ink-200",
        className,
      )}
    >
      {children}
    </span>
  );
}
