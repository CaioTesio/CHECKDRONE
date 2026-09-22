-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ATENDIMENTO',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "data" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "docType" TEXT NOT NULL DEFAULT 'CPF',
    "document" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "zipCode" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "district" TEXT,
    "city" TEXT,
    "state" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "customers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "equipment_models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT,
    "assetTag" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "equipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "equipment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_order_status" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "service_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL,
    "publicToken" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEBIDA',
    "maintenanceType" TEXT NOT NULL,
    "maintenanceTypeOther" TEXT,
    "entryAt" DATETIME NOT NULL,
    "customerReport" TEXT,
    "requestedService" TEXT,
    "entryNotes" TEXT,
    "internalNotes" TEXT,
    "createdById" TEXT,
    "assignedToId" TEXT,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "service_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "service_orders_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "service_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "service_orders_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceOrderId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "service_order_items_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "checklist_template_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "service_order_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceOrderId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'EQUIPAMENTO',
    "description" TEXT,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,
    CONSTRAINT "service_order_photos_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "service_order_photos_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_order_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceOrderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "service_order_history_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "service_order_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_document_key" ON "customers"("document");

-- CreateIndex
CREATE INDEX "equipment_models_category_idx" ON "equipment_models"("category");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_models_brand_name_key" ON "equipment_models"("brand", "name");

-- CreateIndex
CREATE INDEX "equipment_customerId_idx" ON "equipment"("customerId");

-- CreateIndex
CREATE INDEX "equipment_serialNumber_idx" ON "equipment"("serialNumber");

-- CreateIndex
CREATE INDEX "equipment_model_idx" ON "equipment"("model");

-- CreateIndex
CREATE UNIQUE INDEX "service_order_status_code_key" ON "service_order_status"("code");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_number_key" ON "service_orders"("number");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_publicToken_key" ON "service_orders"("publicToken");

-- CreateIndex
CREATE INDEX "service_orders_status_idx" ON "service_orders"("status");

-- CreateIndex
CREATE INDEX "service_orders_customerId_idx" ON "service_orders"("customerId");

-- CreateIndex
CREATE INDEX "service_orders_equipmentId_idx" ON "service_orders"("equipmentId");

-- CreateIndex
CREATE INDEX "service_orders_entryAt_idx" ON "service_orders"("entryAt");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_year_seq_key" ON "service_orders"("year", "seq");

-- CreateIndex
CREATE INDEX "service_order_items_serviceOrderId_idx" ON "service_order_items"("serviceOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_template_items_label_key" ON "checklist_template_items"("label");

-- CreateIndex
CREATE INDEX "service_order_photos_serviceOrderId_idx" ON "service_order_photos"("serviceOrderId");

-- CreateIndex
CREATE INDEX "service_order_history_serviceOrderId_createdAt_idx" ON "service_order_history"("serviceOrderId", "createdAt");
