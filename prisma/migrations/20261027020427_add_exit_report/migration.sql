-- CreateTable
CREATE TABLE "service_order_exit_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceOrderId" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL,
    "finalNotes" TEXT,
    "issuesFound" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "service_order_exit_reports_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "service_order_exit_reports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_order_exit_report_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "service_order_replaced_parts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exitReportId" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "service_order_replaced_parts_exitReportId_fkey" FOREIGN KEY ("exitReportId") REFERENCES "service_order_exit_reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_order_motor_status" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exitReportId" TEXT NOT NULL,
    "motorNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OK',
    "notes" TEXT,
    CONSTRAINT "service_order_motor_status_exitReportId_fkey" FOREIGN KEY ("exitReportId") REFERENCES "service_order_exit_reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "service_order_exit_reports_serviceOrderId_key" ON "service_order_exit_reports"("serviceOrderId");

-- CreateIndex
CREATE INDEX "service_order_exit_reports_serviceOrderId_idx" ON "service_order_exit_reports"("serviceOrderId");

-- CreateIndex
CREATE INDEX "service_order_replaced_parts_exitReportId_idx" ON "service_order_replaced_parts"("exitReportId");

-- CreateIndex
CREATE INDEX "service_order_motor_status_exitReportId_idx" ON "service_order_motor_status"("exitReportId");

-- CreateIndex
CREATE UNIQUE INDEX "service_order_motor_status_exitReportId_motorNumber_key" ON "service_order_motor_status"("exitReportId", "motorNumber");
