import * as React from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400 dark:bg-ink-800">
          {icon}
        </span>
      ) : null}
      <div>
        <p className="font-medium">{title}</p>
        {description ? <p className="mt-1 text-sm muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
