import * as React from "react";

export function InfoList({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>;
}

export function InfoItem({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide muted">{label}</dt>
      <dd className="mt-1 text-sm break-words whitespace-pre-line">{children ?? "—"}</dd>
    </div>
  );
}
