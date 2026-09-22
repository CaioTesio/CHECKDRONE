export const ROLES = {
  ADMIN: "ADMIN",
  TECNICO: "TECNICO",
  ATENDIMENTO: "ATENDIMENTO",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  TECNICO: "Técnico",
  ATENDIMENTO: "Atendimento",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: "Acesso total ao sistema, incluindo usuários e configurações.",
  TECNICO:
    "Visualiza O.S., atualiza status, adiciona diagnóstico, fotos e observações.",
  ATENDIMENTO: "Cadastra clientes e equipamentos e abre novas O.S.",
};

/**
 * Permissões do sistema. Centralizadas aqui para que novos módulos
 * (orçamento, estoque, financeiro) apenas acrescentem chaves.
 */
export const PERMISSIONS = {
  "dashboard:view": ["ADMIN", "TECNICO", "ATENDIMENTO"],
  "os:view": ["ADMIN", "TECNICO", "ATENDIMENTO"],
  "os:create": ["ADMIN", "ATENDIMENTO"],
  "os:update": ["ADMIN", "TECNICO", "ATENDIMENTO"],
  "os:changeStatus": ["ADMIN", "TECNICO"],
  "os:addPhotos": ["ADMIN", "TECNICO", "ATENDIMENTO"],
  "os:addNote": ["ADMIN", "TECNICO", "ATENDIMENTO"],
  "os:delete": ["ADMIN"],
  "customer:view": ["ADMIN", "TECNICO", "ATENDIMENTO"],
  "customer:manage": ["ADMIN", "ATENDIMENTO"],
  "equipment:view": ["ADMIN", "TECNICO", "ATENDIMENTO"],
  "equipment:create": ["ADMIN", "ATENDIMENTO"],
  "equipment:update": ["ADMIN", "ATENDIMENTO", "TECNICO"],
  "user:manage": ["ADMIN"],
  "audit:view": ["ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: string | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

export function isRole(value: string): value is Role {
  return value in ROLE_LABELS;
}
