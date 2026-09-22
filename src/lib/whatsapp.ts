import { maintenanceLabel } from "./catalog";
import { formatDate, formatTime, toWhatsAppNumber } from "./format";

export type WhatsAppOrder = {
  number: string;
  entryAt: Date | string;
  maintenanceType: string;
  maintenanceTypeOther?: string | null;
  publicToken: string;
  customer: { name: string; whatsapp?: string | null; phone?: string | null };
  equipment: { brand?: string | null; model: string; serialNumber?: string | null };
  items: { label: string; quantity: number }[];
};

export function publicOrderPath(number: string, token: string): string {
  return `/os/${encodeURIComponent(number)}/${encodeURIComponent(token)}`;
}

export function publicOrderUrl(number: string, token: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}${publicOrderPath(number, token)}`;
}

/** Monta a mensagem de confirmação de entrada enviada ao cliente. */
export function buildWhatsAppMessage(order: WhatsAppOrder, baseUrl: string): string {
  const firstName = order.customer.name.trim().split(/\s+/)[0] ?? order.customer.name;
  const equipment = [order.equipment.brand, order.equipment.model]
    .filter(Boolean)
    .join(" ");
  const items = order.items.length
    ? order.items
        .map((i) => `• ${i.quantity > 1 ? `${i.quantity}x ` : ""}${i.label}`)
        .join("\n")
    : "• (nenhum item registrado)";

  const lines = [
    `Olá, ${firstName}! 👋`,
    `Recebemos seu equipamento na CFT Drones.`,
    ``,
    `📋 O.S.: ${order.number}`,
    `📅 Entrada: ${formatDate(order.entryAt)} às ${formatTime(order.entryAt)}`,
    `🚁 Equipamento: ${equipment}`,
  ];

  if (order.equipment.serialNumber) {
    lines.push(`🔢 Nº de série: ${order.equipment.serialNumber}`);
  }

  lines.push(
    ``,
    `Itens deixados na assistência:`,
    items,
    ``,
    `🔧 Tipo de atendimento: ${maintenanceLabel(order.maintenanceType, order.maintenanceTypeOther)}`,
    ``,
    `Para visualizar os detalhes completos da entrada, incluindo as fotos do equipamento:`,
    `👉 ${publicOrderUrl(order.number, order.publicToken, baseUrl)}`,
    ``,
    `CFT Drones`,
  );

  return lines.join("\n");
}

/** Link wa.me com a mensagem pronta. Retorna null se não houver número válido. */
export function buildWhatsAppLink(order: WhatsAppOrder, baseUrl: string): string | null {
  const phone = toWhatsAppNumber(order.customer.whatsapp || order.customer.phone);
  const text = encodeURIComponent(buildWhatsAppMessage(order, baseUrl));
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${text}`;
}
