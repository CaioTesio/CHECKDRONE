import { z } from "zod";
import { EQUIPMENT_CATEGORIES, MAINTENANCE_TYPES, PHOTO_CATEGORIES } from "@/lib/catalog";
import { isValidDocument, onlyDigits } from "@/lib/format";
import { STATUS_CODES } from "@/lib/status";

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const customerSchema = z
  .object({
    name: z.string().trim().min(3, "Informe o nome completo / razão social").max(180),
    docType: z.enum(["CPF", "CNPJ"]),
    document: z
      .string()
      .trim()
      .transform((v) => onlyDigits(v))
      .transform((v) => (v === "" ? null : v))
      .nullable()
      .optional(),
    phone: optionalText(30),
    whatsapp: optionalText(30),
    email: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : v))
      .nullable()
      .optional()
      .refine((v) => v === null || v === undefined || z.string().email().safeParse(v).success, {
        message: "E-mail inválido",
      }),
    zipCode: optionalText(12),
    street: optionalText(180),
    number: optionalText(20),
    complement: optionalText(120),
    district: optionalText(120),
    city: optionalText(120),
    state: optionalText(2),
    notes: optionalText(1000),
  })
  .refine((data) => !data.document || isValidDocument(data.document, data.docType), {
    message: "CPF/CNPJ inválido",
    path: ["document"],
  });

export type CustomerInput = z.infer<typeof customerSchema>;

export const equipmentSchema = z.object({
  customerId: z.string().min(1, "Selecione o cliente"),
  category: z.enum(EQUIPMENT_CATEGORIES),
  brand: optionalText(80),
  model: z.string().trim().min(1, "Informe o modelo").max(120),
  serialNumber: optionalText(80),
  assetTag: optionalText(80),
  notes: optionalText(1000),
});

export type EquipmentInput = z.infer<typeof equipmentSchema>;

export const checklistItemSchema = z.object({
  label: z.string().trim().min(1).max(120),
  quantity: z.coerce.number().int().min(1).max(999),
  notes: optionalText(300),
  isCustom: z.boolean().optional().default(false),
});

export const photoMetaSchema = z.object({
  id: z.string().min(1),
  category: z.enum(PHOTO_CATEGORIES.map((c) => c.code) as [string, ...string[]]),
  description: optionalText(200),
});

export const createOrderSchema = z.object({
  customerId: z.string().min(1, "Selecione o cliente"),
  equipmentId: z.string().min(1, "Selecione o equipamento"),
  entryAt: z.coerce.date({ message: "Data/hora de entrada inválida" }),
  maintenanceType: z.enum(MAINTENANCE_TYPES.map((t) => t.code) as [string, ...string[]], {
    message: "Selecione o tipo de manutenção",
  }),
  maintenanceTypeOther: optionalText(80),
  customerReport: optionalText(4000),
  requestedService: optionalText(4000),
  entryNotes: optionalText(4000),
  items: z.array(checklistItemSchema).max(60),
  photos: z.array(photoMetaSchema).max(40),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const statusChangeSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(STATUS_CODES as [string, ...string[]], { message: "Status inválido" }),
  note: optionalText(500),
});

export const noteSchema = z.object({
  orderId: z.string().min(1),
  message: z.string().trim().min(1, "Escreva a observação").max(2000),
  isPublic: z.boolean().optional().default(false),
});

export const userSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  role: z.enum(["ADMIN", "TECNICO", "ATENDIMENTO"]),
  active: z.boolean().optional().default(true),
  password: z
    .string()
    .min(8, "A senha deve ter ao menos 8 caracteres")
    .max(72)
    .optional()
    .or(z.literal("")),
});
