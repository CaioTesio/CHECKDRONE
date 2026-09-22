import "server-only";
import { prisma } from "@/lib/db";
import { onlyDigits } from "@/lib/format";

export type GlobalSearchResult = {
  orders: {
    id: string;
    number: string;
    status: string;
    customerName: string;
    equipment: string;
    entryAt: Date;
  }[];
  customers: {
    id: string;
    name: string;
    document: string | null;
    phone: string | null;
    ordersCount: number;
  }[];
  equipment: {
    id: string;
    label: string;
    serialNumber: string | null;
    customerName: string;
    customerId: string;
  }[];
};

/**
 * Busca global: nº da O.S., cliente, CPF/CNPJ, telefone/WhatsApp,
 * modelo e número de série.
 */
export async function globalSearch(term: string, limit = 5): Promise<GlobalSearchResult> {
  const q = term.trim();
  if (q.length < 2) return { orders: [], customers: [], equipment: [] };
  const digits = onlyDigits(q);

  const customerMatch = {
    OR: [
      { name: { contains: q } },
      ...(digits.length >= 3
        ? [
            { document: { contains: digits } },
            { phone: { contains: digits } },
            { whatsapp: { contains: digits } },
          ]
        : []),
      { email: { contains: q } },
    ],
  };

  const [orders, customers, equipment] = await Promise.all([
    prisma.serviceOrder.findMany({
      where: {
        OR: [
          { number: { contains: q } },
          { customer: customerMatch },
          {
            equipment: {
              OR: [{ model: { contains: q } }, { serialNumber: { contains: q } }],
            },
          },
        ],
      },
      select: {
        id: true,
        number: true,
        status: true,
        entryAt: true,
        customer: { select: { name: true } },
        equipment: { select: { brand: true, model: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.customer.findMany({
      where: customerMatch,
      select: {
        id: true,
        name: true,
        document: true,
        phone: true,
        _count: { select: { serviceOrders: true } },
      },
      orderBy: { name: "asc" },
      take: limit,
    }),
    prisma.equipment.findMany({
      where: {
        OR: [
          { model: { contains: q } },
          { serialNumber: { contains: q } },
          { assetTag: { contains: q } },
          { customer: customerMatch },
        ],
      },
      select: {
        id: true,
        brand: true,
        model: true,
        serialNumber: true,
        customerId: true,
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  return {
    orders: orders.map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      entryAt: o.entryAt,
      customerName: o.customer.name,
      equipment: [o.equipment.brand, o.equipment.model].filter(Boolean).join(" "),
    })),
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      document: c.document,
      phone: c.phone,
      ordersCount: c._count.serviceOrders,
    })),
    equipment: equipment.map((e) => ({
      id: e.id,
      label: [e.brand, e.model].filter(Boolean).join(" "),
      serialNumber: e.serialNumber,
      customerId: e.customerId,
      customerName: e.customer.name,
    })),
  };
}
