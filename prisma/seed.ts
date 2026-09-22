/**
 * Dados iniciais + dados fictícios de demonstração.
 * Idempotente: pode ser executado novamente sem duplicar registros.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { STATUS_LIST } from "../src/lib/status";
import {
  DEFAULT_CHECKLIST_ITEMS,
  DEFAULT_EQUIPMENT_MODELS,
} from "../src/lib/catalog";
import { formatOsNumber } from "../src/lib/os-number";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./data/cft-drones.db",
});
const prisma = new PrismaClient({ adapter });

const STORAGE_ROOT = path.resolve(process.env.STORAGE_DIR ?? "./storage/uploads");

function publicToken(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return [...randomBytes(16)].map((b) => alphabet[b % alphabet.length]).join("");
}

/** Gera um PNG real (cor sólida com uma faixa) para as fotos de demonstração. */
function makePng(width: number, height: number, rgb: [number, number, number]): Buffer {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0; // filter type none
    for (let x = 0; x < width; x++) {
      const band = y > height * 0.62 && y < height * 0.78;
      raw[o++] = band ? 255 - rgb[0] : rgb[0];
      raw[o++] = band ? 255 - rgb[1] : rgb[1];
      raw[o++] = band ? 255 - rgb[2] : rgb[2];
    }
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData) >>> 0);
    return Buffer.concat([len, typeAndData, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

async function storeDemoPhoto(rgb: [number, number, number]): Promise<{ key: string; size: number }> {
  const png = makePng(640, 480, rgb);
  const dir = path.join("demo");
  const key = path.join(dir, `${randomBytes(12).toString("hex")}.png`);
  const full = path.join(STORAGE_ROOT, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, png);
  return { key, size: png.byteLength };
}

function at(daysAgo: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("→ Status da O.S.");
  for (const [index, status] of STATUS_LIST.entries()) {
    await prisma.serviceOrderStatus.upsert({
      where: { code: status.code },
      update: { label: status.label, color: status.color, sortOrder: index, isFinal: status.isFinal },
      create: {
        code: status.code,
        label: status.label,
        color: status.color,
        sortOrder: index,
        isFinal: status.isFinal,
      },
    });
  }

  console.log("→ Itens padrão do checklist");
  for (const [index, label] of DEFAULT_CHECKLIST_ITEMS.entries()) {
    await prisma.checklistTemplateItem.upsert({
      where: { label },
      update: { sortOrder: index, active: true },
      create: { label, sortOrder: index },
    });
  }

  console.log("→ Catálogo de modelos");
  for (const [index, model] of DEFAULT_EQUIPMENT_MODELS.entries()) {
    await prisma.equipmentModel.upsert({
      where: { brand_name: { brand: model.brand, name: model.name } },
      update: { category: model.category, sortOrder: index, active: true },
      create: { ...model, sortOrder: index },
    });
  }

  console.log("→ Usuários");
  const users = [
    { name: "Caio Tesio", email: "admin@cftdrones.com.br", role: "ADMIN", password: "admin123" },
    { name: "Rafael Moraes", email: "tecnico@cftdrones.com.br", role: "TECNICO", password: "tecnico123" },
    { name: "Juliana Prado", email: "atendimento@cftdrones.com.br", role: "ATENDIMENTO", password: "atendimento123" },
  ];
  const userByRole: Record<string, string> = {};
  for (const u of users) {
    const record = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, active: true },
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        passwordHash: await bcrypt.hash(u.password, 12),
      },
    });
    userByRole[u.role] = record.id;
  }

  const existingOrders = await prisma.serviceOrder.count();
  if (existingOrders > 0) {
    console.log(`✓ Seed concluído (${existingOrders} O.S. já existentes, demo não recriada).`);
    return;
  }

  console.log("→ Clientes de demonstração");
  const customersData = [
    {
      name: "Fazenda Santa Helena Agropecuária LTDA",
      docType: "CNPJ",
      document: "12345678000195",
      phone: "6733210099",
      whatsapp: "67999120045",
      email: "operacoes@santahelena.agr.br",
      zipCode: "79800000",
      street: "Rodovia MS-156, km 12",
      number: "s/n",
      district: "Zona Rural",
      city: "Dourados",
      state: "MS",
    },
    {
      name: "João Batista Ferreira",
      docType: "CPF",
      document: "39053344705",
      phone: "6798877445",
      whatsapp: "6798877445",
      email: "joao.ferreira@email.com",
      zipCode: "79040100",
      street: "Rua das Palmeiras",
      number: "420",
      district: "Centro",
      city: "Campo Grande",
      state: "MS",
    },
    {
      name: "Agro Precisão Serviços Aéreos ME",
      docType: "CNPJ",
      document: "98765432000110",
      phone: "6734119080",
      whatsapp: "67998112233",
      email: "contato@agroprecisao.com.br",
      city: "Maracaju",
      state: "MS",
    },
    {
      name: "Marcos Andrade Topografia",
      docType: "CPF",
      document: "52998224725",
      phone: "6799445566",
      whatsapp: "6799445566",
      email: "marcos@topoandrade.com.br",
      city: "Três Lagoas",
      state: "MS",
    },
  ];

  const customers = [];
  for (const data of customersData) {
    customers.push(
      await prisma.customer.create({
        data: { ...data, createdById: userByRole.ATENDIMENTO },
      }),
    );
  }

  console.log("→ Equipamentos de demonstração");
  const equipmentData = [
    { customerId: customers[0].id, category: "Drone agrícola", brand: "DJI", model: "Agras T50", serialNumber: "1ZNBJ8G00A1C7K", assetTag: "SH-001" },
    { customerId: customers[0].id, category: "Bateria", brand: "DJI", model: "DB2000 (T50)", serialNumber: "BT50-77120" },
    { customerId: customers[1].id, category: "Drone agrícola", brand: "DJI", model: "Agras T40", serialNumber: "1ZNBJ4C00B9X2M" },
    { customerId: customers[2].id, category: "Drone Enterprise", brand: "DJI", model: "Matrice 350 RTK", serialNumber: "1581F5FQD24AN00C1234" },
    { customerId: customers[2].id, category: "LiDAR", brand: "DJI", model: "Zenmuse L2", serialNumber: "L2-99321" },
    { customerId: customers[3].id, category: "Drone Enterprise", brand: "DJI", model: "Mavic 3M", serialNumber: "1581F6QBD24BN00D9911" },
  ];
  const equipment = [];
  for (const data of equipmentData) {
    equipment.push(
      await prisma.equipment.create({ data: { ...data, createdById: userByRole.ATENDIMENTO } }),
    );
  }

  console.log("→ Ordens de serviço de demonstração");
  const year = new Date().getFullYear();
  const orders = [
    {
      customer: customers[0],
      equipment: equipment[0],
      status: "EM_MANUTENCAO",
      maintenanceType: "CORRETIVA",
      entryAt: at(9, 14, 32),
      customerReport:
        "Cliente relata que o drone apresentou perda de potência durante o voo e desligou automaticamente após cerca de 6 minutos de pulverização.",
      requestedService:
        "Realizar diagnóstico completo, verificar motores, ESC, sistema de alimentação e atualização de firmware.",
      entryNotes:
        "Equipamento apresenta marcas de uso na parte inferior e respingos de calda no chassi. Hélices dianteiras com desgaste.",
      items: [
        { label: "Drone", quantity: 1 },
        { label: "Controle remoto", quantity: 1 },
        { label: "Bateria do drone", quantity: 2, notes: "DB2000 — com marcas de uso" },
        { label: "Carregador", quantity: 1 },
        { label: "Hélices", quantity: 4, notes: "2 pares sobressalentes" },
      ],
      photos: [
        { category: "EQUIPAMENTO", description: "Vista geral do equipamento na entrada", rgb: [64, 92, 128] },
        { category: "NUMERO_SERIE", description: "Etiqueta com número de série", rgb: [110, 110, 118] },
        { category: "AVARIAS", description: "Risco na lateral esquerda do braço 3", rgb: [140, 74, 60] },
        { category: "BATERIAS", description: "Estado das baterias entregues", rgb: [70, 118, 92] },
      ],
      history: [
        { daysAgo: 9, h: 14, m: 35, type: "PHOTOS_ADDED", message: "4 fotos adicionadas à entrada", isPublic: true },
        { daysAgo: 9, h: 15, m: 10, type: "STATUS_CHANGE", message: "Equipamento encaminhado para diagnóstico", from: "RECEBIDA", to: "EM_ANALISE", isPublic: true },
        { daysAgo: 8, h: 9, m: 20, type: "NOTE", message: "Diagnóstico iniciado: leitura de logs de voo e teste de bancada dos ESCs." },
        { daysAgo: 8, h: 11, m: 40, type: "STATUS_CHANGE", message: "Orçamento enviado ao cliente", from: "EM_ANALISE", to: "ORCAMENTO_ENVIADO", isPublic: true },
        { daysAgo: 6, h: 14, m: 0, type: "STATUS_CHANGE", message: "Cliente aprovou o orçamento", from: "ORCAMENTO_ENVIADO", to: "APROVADA", isPublic: true },
        { daysAgo: 5, h: 8, m: 30, type: "STATUS_CHANGE", message: "Manutenção iniciada na bancada 2", from: "APROVADA", to: "EM_MANUTENCAO", isPublic: true },
      ],
    },
    {
      customer: customers[1],
      equipment: equipment[2],
      status: "PRONTA_PARA_RETIRADA",
      maintenanceType: "PREVENTIVA",
      entryAt: at(15, 9, 12),
      customerReport: "Revisão das 200 horas de voo. Sem falhas relatadas.",
      requestedService: "Revisão preventiva completa, limpeza do sistema de pulverização e calibração de sensores.",
      entryNotes: "Equipamento em bom estado geral. Bicos com acúmulo de resíduo.",
      items: [
        { label: "Drone", quantity: 1 },
        { label: "Controle remoto", quantity: 1 },
        { label: "Bateria do drone", quantity: 4 },
        { label: "Hub de carregamento", quantity: 1 },
      ],
      photos: [
        { category: "EQUIPAMENTO", description: "Equipamento recebido para revisão", rgb: [78, 104, 86] },
        { category: "ACESSORIOS", description: "Acessórios entregues junto ao drone", rgb: [96, 96, 112] },
      ],
      history: [
        { daysAgo: 15, h: 9, m: 30, type: "STATUS_CHANGE", message: "Iniciada a inspeção preventiva", from: "RECEBIDA", to: "EM_ANALISE", isPublic: true },
        { daysAgo: 13, h: 16, m: 20, type: "STATUS_CHANGE", message: "Revisão em execução", from: "EM_ANALISE", to: "EM_MANUTENCAO", isPublic: true },
        { daysAgo: 4, h: 17, m: 5, type: "STATUS_CHANGE", message: "Revisão concluída e testada em voo estacionário", from: "EM_MANUTENCAO", to: "MANUTENCAO_CONCLUIDA", isPublic: true },
        { daysAgo: 3, h: 10, m: 0, type: "STATUS_CHANGE", message: "Equipamento liberado para retirada", from: "MANUTENCAO_CONCLUIDA", to: "PRONTA_PARA_RETIRADA", isPublic: true },
      ],
    },
    {
      customer: customers[2],
      equipment: equipment[3],
      status: "AGUARDANDO_APROVACAO",
      maintenanceType: "DIAGNOSTICO",
      entryAt: at(4, 16, 5),
      customerReport: "Gimbal apresentando ruído e travamento intermitente durante levantamento.",
      requestedService: "Diagnosticar o gimbal e avaliar necessidade de substituição do conjunto.",
      entryNotes: "Recebido com maleta original e 2 baterias TB65.",
      items: [
        { label: "Drone", quantity: 1 },
        { label: "Controle remoto", quantity: 1 },
        { label: "Bateria do drone", quantity: 2, notes: "TB65" },
        { label: "Bolsa/maleta", quantity: 1 },
      ],
      photos: [
        { category: "EQUIPAMENTO", description: "Matrice 350 RTK na entrada", rgb: [58, 74, 104] },
        { category: "AVARIAS", description: "Folga no eixo do gimbal", rgb: [132, 96, 52] },
      ],
      history: [
        { daysAgo: 4, h: 16, m: 40, type: "STATUS_CHANGE", message: "Equipamento encaminhado para diagnóstico", from: "RECEBIDA", to: "EM_ANALISE", isPublic: true },
        { daysAgo: 2, h: 11, m: 15, type: "STATUS_CHANGE", message: "Orçamento enviado ao cliente", from: "EM_ANALISE", to: "ORCAMENTO_ENVIADO", isPublic: true },
        { daysAgo: 1, h: 9, m: 0, type: "STATUS_CHANGE", message: "Aguardando retorno do cliente sobre o orçamento", from: "ORCAMENTO_ENVIADO", to: "AGUARDANDO_APROVACAO", isPublic: true },
      ],
    },
    {
      customer: customers[3],
      equipment: equipment[5],
      status: "RECEBIDA",
      maintenanceType: "GARANTIA",
      entryAt: at(1, 10, 45),
      customerReport: "Equipamento não realiza pareamento com o controle após atualização de firmware.",
      requestedService: "Verificar em garantia: pareamento, firmware e módulo de rádio.",
      entryNotes: "Equipamento com 3 meses de uso, nota fiscal apresentada pelo cliente.",
      items: [
        { label: "Drone", quantity: 1 },
        { label: "Controle remoto", quantity: 1 },
        { label: "Bateria do drone", quantity: 3 },
        { label: "Carregador", quantity: 1 },
        { label: "Cabos", quantity: 2 },
      ],
      photos: [
        { category: "EQUIPAMENTO", description: "Mavic 3M recebido", rgb: [88, 88, 96] },
        { category: "EMBALAGEM", description: "Embalagem original entregue pelo cliente", rgb: [116, 104, 80] },
      ],
      history: [],
    },
    {
      customer: customers[0],
      equipment: equipment[1],
      status: "FINALIZADA",
      maintenanceType: "CORRETIVA",
      entryAt: at(40, 11, 20),
      customerReport: "Bateria não carrega além de 60% e apresenta erro no hub.",
      requestedService: "Avaliar células e BMS da bateria.",
      entryNotes: "Bateria com 310 ciclos.",
      items: [{ label: "Bateria do drone", quantity: 1, notes: "DB2000" }],
      photos: [{ category: "BATERIAS", description: "Bateria recebida para análise", rgb: [80, 100, 70] }],
      history: [
        { daysAgo: 39, h: 10, m: 0, type: "STATUS_CHANGE", message: "Análise iniciada", from: "RECEBIDA", to: "EM_ANALISE", isPublic: true },
        { daysAgo: 36, h: 15, m: 0, type: "STATUS_CHANGE", message: "Reparo concluído — BMS substituído", from: "EM_ANALISE", to: "MANUTENCAO_CONCLUIDA", isPublic: true },
        { daysAgo: 34, h: 9, m: 30, type: "STATUS_CHANGE", message: "Equipamento retirado pelo cliente", from: "MANUTENCAO_CONCLUIDA", to: "FINALIZADA", isPublic: true },
      ],
    },
  ];

  let seq = 0;
  for (const spec of orders) {
    seq += 1;
    const order = await prisma.serviceOrder.create({
      data: {
        number: formatOsNumber(year, seq),
        year,
        seq,
        publicToken: publicToken(),
        customerId: spec.customer.id,
        equipmentId: spec.equipment.id,
        status: spec.status,
        maintenanceType: spec.maintenanceType,
        entryAt: spec.entryAt,
        customerReport: spec.customerReport,
        requestedService: spec.requestedService,
        entryNotes: spec.entryNotes,
        createdById: userByRole.ATENDIMENTO,
        assignedToId: userByRole.TECNICO,
        closedAt: spec.status === "FINALIZADA" ? at(34, 9, 30) : null,
        createdAt: spec.entryAt,
        items: {
          create: spec.items.map((item, index) => ({
            label: item.label,
            quantity: item.quantity,
            notes: "notes" in item ? item.notes : null,
            sortOrder: index,
          })),
        },
      },
    });

    for (const [index, photo] of spec.photos.entries()) {
      const stored = await storeDemoPhoto(photo.rgb as [number, number, number]);
      await prisma.serviceOrderPhoto.create({
        data: {
          serviceOrderId: order.id,
          category: photo.category,
          description: photo.description,
          storageKey: stored.key,
          mimeType: "image/png",
          size: stored.size,
          sortOrder: index,
          uploadedById: userByRole.ATENDIMENTO,
          createdAt: spec.entryAt,
        },
      });
    }

    await prisma.serviceOrderHistory.create({
      data: {
        serviceOrderId: order.id,
        type: "CREATED",
        message: `O.S. ${order.number} criada`,
        toStatus: "RECEBIDA",
        isPublic: true,
        userId: userByRole.ATENDIMENTO,
        createdAt: spec.entryAt,
      },
    });

    for (const entry of spec.history) {
      await prisma.serviceOrderHistory.create({
        data: {
          serviceOrderId: order.id,
          type: entry.type,
          message: entry.message,
          fromStatus: "from" in entry ? entry.from : null,
          toStatus: "to" in entry ? entry.to : null,
          isPublic: entry.isPublic ?? false,
          userId: entry.type === "NOTE" ? userByRole.TECNICO : userByRole.TECNICO,
          createdAt: at(entry.daysAgo, entry.h, entry.m),
        },
      });
    }
  }

  console.log("✓ Seed concluído.");
  console.log("  admin@cftdrones.com.br / admin123");
  console.log("  tecnico@cftdrones.com.br / tecnico123");
  console.log("  atendimento@cftdrones.com.br / atendimento123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
