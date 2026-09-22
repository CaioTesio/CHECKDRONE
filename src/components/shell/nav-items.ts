import {
  ClipboardList,
  LayoutDashboard,
  Plane,
  Search,
  Users,
  UserCog,
} from "lucide-react";
import type { Permission } from "@/lib/roles";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
  permission: Permission;
  /** Aparece na barra inferior do celular. */
  mobile?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    shortLabel: "Início",
    icon: LayoutDashboard,
    permission: "dashboard:view",
    mobile: true,
  },
  {
    href: "/ordens",
    label: "Ordens de Serviço",
    shortLabel: "O.S.",
    icon: ClipboardList,
    permission: "os:view",
    mobile: true,
  },
  {
    href: "/clientes",
    label: "Clientes",
    shortLabel: "Clientes",
    icon: Users,
    permission: "customer:view",
    mobile: true,
  },
  {
    href: "/equipamentos",
    label: "Equipamentos",
    shortLabel: "Equip.",
    icon: Plane,
    permission: "equipment:view",
    mobile: false,
  },
  {
    href: "/busca",
    label: "Busca global",
    shortLabel: "Busca",
    icon: Search,
    permission: "os:view",
    mobile: true,
  },
  {
    href: "/usuarios",
    label: "Usuários",
    shortLabel: "Usuários",
    icon: UserCog,
    permission: "user:manage",
    mobile: false,
  },
];
