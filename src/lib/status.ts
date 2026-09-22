/** Status da O.S. — a ordem aqui define a ordem exibida na UI. */
export const STATUS_LIST = [
  { code: "RECEBIDA", label: "Recebida", color: "blue", isFinal: false },
  { code: "EM_ANALISE", label: "Em análise", color: "amber", isFinal: false },
  { code: "AGUARDANDO_ORCAMENTO", label: "Aguardando orçamento", color: "amber", isFinal: false },
  { code: "ORCAMENTO_ENVIADO", label: "Orçamento enviado", color: "orange", isFinal: false },
  { code: "AGUARDANDO_APROVACAO", label: "Aguardando aprovação", color: "orange", isFinal: false },
  { code: "APROVADA", label: "Aprovada", color: "teal", isFinal: false },
  { code: "EM_MANUTENCAO", label: "Em manutenção", color: "violet", isFinal: false },
  { code: "AGUARDANDO_PECA", label: "Aguardando peça", color: "rose", isFinal: false },
  { code: "MANUTENCAO_CONCLUIDA", label: "Manutenção concluída", color: "green", isFinal: false },
  { code: "PRONTA_PARA_RETIRADA", label: "Pronta para retirada", color: "green", isFinal: false },
  { code: "FINALIZADA", label: "Finalizada", color: "slate", isFinal: true },
  { code: "CANCELADA", label: "Cancelada", color: "red", isFinal: true },
] as const;

export type StatusCode = (typeof STATUS_LIST)[number]["code"];

export const STATUS_MAP = Object.fromEntries(
  STATUS_LIST.map((s) => [s.code, s]),
) as Record<StatusCode, (typeof STATUS_LIST)[number]>;

export const STATUS_CODES = STATUS_LIST.map((s) => s.code) as StatusCode[];

export function statusLabel(code: string): string {
  return STATUS_MAP[code as StatusCode]?.label ?? code;
}

export function statusColor(code: string): string {
  return STATUS_MAP[code as StatusCode]?.color ?? "slate";
}

export function isValidStatus(code: string): code is StatusCode {
  return code in STATUS_MAP;
}

/** Classes Tailwind por cor de status (badge). */
export const STATUS_BADGE_CLASSES: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/30",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30",
  orange: "bg-orange-50 text-orange-800 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-400/30",
  teal: "bg-teal-50 text-teal-800 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-400/30",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/30",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30",
  red: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/30",
  slate: "bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30",
};

/** Cor sólida (bolinha do timeline / dashboard). */
export const STATUS_DOT_CLASSES: Record<string, string> = {
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  teal: "bg-teal-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  slate: "bg-slate-400",
};

/** Status agrupados para os cards do dashboard. */
export const DASHBOARD_GROUPS = [
  { key: "abertas", label: "O.S. abertas", statuses: STATUS_CODES.filter((c) => c !== "FINALIZADA" && c !== "CANCELADA") },
  { key: "analise", label: "Em análise", statuses: ["EM_ANALISE"] as StatusCode[] },
  { key: "aprovacao", label: "Aguardando aprovação", statuses: ["AGUARDANDO_APROVACAO", "ORCAMENTO_ENVIADO", "AGUARDANDO_ORCAMENTO"] as StatusCode[] },
  { key: "manutencao", label: "Em manutenção", statuses: ["EM_MANUTENCAO", "AGUARDANDO_PECA", "APROVADA"] as StatusCode[] },
  { key: "prontas", label: "Prontas para retirada", statuses: ["PRONTA_PARA_RETIRADA", "MANUTENCAO_CONCLUIDA"] as StatusCode[] },
  { key: "finalizadas", label: "Finalizadas", statuses: ["FINALIZADA"] as StatusCode[] },
] as const;
