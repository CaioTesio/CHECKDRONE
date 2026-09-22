export const EQUIPMENT_CATEGORIES = [
  "Drone agrícola",
  "Drone Enterprise",
  "Controle remoto",
  "Bateria",
  "Carregador",
  "Câmera",
  "LiDAR",
  "Estação RTK",
  "Dock",
  "Outro",
] as const;

export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export const MAINTENANCE_TYPES = [
  { code: "PREVENTIVA", label: "Preventiva" },
  { code: "CORRETIVA", label: "Corretiva" },
  { code: "DIAGNOSTICO", label: "Diagnóstico" },
  { code: "GARANTIA", label: "Garantia" },
  { code: "REVISAO", label: "Revisão" },
  { code: "OUTRO", label: "Outro" },
] as const;

export type MaintenanceTypeCode = (typeof MAINTENANCE_TYPES)[number]["code"];

export const MAINTENANCE_TYPE_MAP = Object.fromEntries(
  MAINTENANCE_TYPES.map((t) => [t.code, t.label]),
) as Record<string, string>;

export function maintenanceLabel(code: string, other?: string | null): string {
  if (code === "OUTRO" && other) return other;
  return MAINTENANCE_TYPE_MAP[code] ?? code;
}

export const PHOTO_CATEGORIES = [
  { code: "EQUIPAMENTO", label: "Equipamento" },
  { code: "NUMERO_SERIE", label: "Número de série" },
  { code: "AVARIAS", label: "Avarias" },
  { code: "ACESSORIOS", label: "Acessórios" },
  { code: "BATERIAS", label: "Baterias" },
  { code: "EMBALAGEM", label: "Embalagem" },
  { code: "OUTROS", label: "Outros" },
] as const;

export type PhotoCategoryCode = (typeof PHOTO_CATEGORIES)[number]["code"];

export const PHOTO_CATEGORY_MAP = Object.fromEntries(
  PHOTO_CATEGORIES.map((c) => [c.code, c.label]),
) as Record<string, string>;

/** Itens padrão do checklist de entrada (usados no seed). */
export const DEFAULT_CHECKLIST_ITEMS = [
  "Drone",
  "Controle remoto",
  "Bateria do drone",
  "Bateria do controle",
  "Carregador",
  "Hub de carregamento",
  "Fonte de alimentação",
  "Cabos",
  "Hélices",
  "RTK",
  "Antenas",
  "Câmera",
  "Bolsa/maleta",
  "Outros acessórios",
];

/** Catálogo inicial de modelos (usado no seed). */
export const DEFAULT_EQUIPMENT_MODELS: {
  category: EquipmentCategory;
  brand: string;
  name: string;
}[] = [
  { category: "Drone agrícola", brand: "DJI", name: "Agras T25" },
  { category: "Drone agrícola", brand: "DJI", name: "Agras T25P" },
  { category: "Drone agrícola", brand: "DJI", name: "Agras T40" },
  { category: "Drone agrícola", brand: "DJI", name: "Agras T50" },
  { category: "Drone Enterprise", brand: "DJI", name: "Matrice 350 RTK" },
  { category: "Drone Enterprise", brand: "DJI", name: "Matrice 400" },
  { category: "Drone Enterprise", brand: "DJI", name: "Matrice 4T" },
  { category: "Drone Enterprise", brand: "DJI", name: "Mavic 3M" },
  { category: "Dock", brand: "DJI", name: "Dock 2" },
  { category: "Dock", brand: "DJI", name: "Dock 3" },
  { category: "LiDAR", brand: "DJI", name: "Zenmuse L2" },
  { category: "Câmera", brand: "DJI", name: "Zenmuse H30T" },
  { category: "Estação RTK", brand: "DJI", name: "D-RTK 3" },
  { category: "Bateria", brand: "DJI", name: "TB65" },
  { category: "Bateria", brand: "DJI", name: "DB2000 (T50)" },
  { category: "Controle remoto", brand: "DJI", name: "RC Plus" },
  { category: "Carregador", brand: "DJI", name: "C7000 Charger" },
];
