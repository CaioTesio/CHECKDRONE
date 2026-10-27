import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/db";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const { reportId } = await params;

    const report = await prisma.serviceOrderExitReport.findUnique({
      where: { id: reportId },
      include: {
        serviceOrder: {
          include: {
            customer: true,
            equipment: true,
          },
        },
        replacedParts: {
          orderBy: { sortOrder: "asc" },
        },
        motorStatus: {
          orderBy: { motorNumber: "asc" },
        },
        createdBy: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Relatório não encontrado" },
        { status: 404 },
      );
    }

    // Criar PDF
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
    });

    const response = new NextResponse();
    const filename = `relatorio-saida-OS-${report.serviceOrder.number}.pdf`;

    response.headers.set(
      "Content-Type",
      "application/pdf; charset=utf-8",
    );
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${filename}"`,
    );

    // Usar a função de pipe do documento
    return new NextResponse(
      new ReadableStream({
        start(controller) {
          doc.on("data", (chunk) => {
            controller.enqueue(chunk);
          });

          doc.on("end", () => {
            controller.close();
          });

          // Cabeçalho
          doc
            .fontSize(24)
            .font("Helvetica-Bold")
            .text("📋 Relatório de Saída", { align: "center" });

          doc.moveDown(0.3);

          doc
            .fontSize(11)
            .font("Helvetica")
            .text(`Ordem de Serviço: OS-${report.serviceOrder.number}`, {
              align: "center",
            });

          doc
            .fontSize(10)
            .text(`Gerado em: ${formatDate(report.completedAt)}`, {
              align: "center",
            });

          doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
          doc.moveDown();

          // Seção 1: Dados da Ordem
          doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .text("📌 Dados da Ordem de Serviço");

          doc.fontSize(10).font("Helvetica");
          const infoY = doc.y;

          doc.text(`Cliente: ${report.serviceOrder.customer.name}`, 50);
          doc.text(`Equipamento: ${report.serviceOrder.equipment.model}`, 50);
          if (report.serviceOrder.equipment.serialNumber) {
            doc.text(
              `Número de Série: ${report.serviceOrder.equipment.serialNumber}`,
              50,
            );
          }

          doc.y = Math.max(doc.y, infoY);
          doc.moveDown();

          // Seção 2: Peças Trocadas
          if (report.replacedParts.length > 0) {
            doc.fontSize(12).font("Helvetica-Bold").text("🔧 Peças Trocadas");

            doc.fontSize(10).font("Helvetica");

            report.replacedParts.forEach((part) => {
              doc.text(`• ${part.partName} (Qty: ${part.quantity})`, 50);
              if (part.description) {
                doc.fontSize(9).text(`  ${part.description}`, 55);
              }
              doc.fontSize(10);
            });

            doc.moveDown();
          }

          // Seção 3: Status dos Motores
          if (report.motorStatus.length > 0) {
            doc.fontSize(12).font("Helvetica-Bold").text("🚁 Status dos Motores");

            doc.fontSize(10).font("Helvetica");

            const motorStatusMap: Record<string, string> = {
              OK: "✅ OK",
              COM_FALHA: "❌ Falha",
              AQUECIMENTO: "🔥 Aquecimento",
              VIBRACAO: "📳 Vibração",
              RUIDO: "🔊 Ruído",
              OUTRO: "❓ Outro",
            };

            report.motorStatus.forEach((motor) => {
              const statusLabel =
                motorStatusMap[motor.status] || motor.status;
              doc.text(`Motor ${motor.motorNumber}: ${statusLabel}`, 50);
              if (motor.notes) {
                doc.fontSize(9).text(`  Nota: ${motor.notes}`, 55);
              }
              doc.fontSize(10);
            });

            doc.moveDown();
          }

          // Seção 4: Observações Finais
          if (report.finalNotes) {
            doc.fontSize(12).font("Helvetica-Bold").text("📝 Observações Finais");
            doc.fontSize(10).font("Helvetica");
            doc.text(report.finalNotes, 50, doc.y, { width: 460 });
            doc.moveDown();
          }

          // Seção 5: Problemas Encontrados
          if (report.issuesFound) {
            doc.fontSize(12).font("Helvetica-Bold").text("⚠️ Problemas Encontrados");
            doc.fontSize(10).font("Helvetica");
            doc.text(report.issuesFound, 50, doc.y, { width: 460 });
            doc.moveDown();
          }

          // Rodapé
          doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
          doc.moveDown(0.5);

          doc.fontSize(9).font("Helvetica").text(
            `Relatório gerado por: ${report.createdBy?.name || "Sistema"}`,
            { align: "center" },
          );

          doc.text(`Data de conclusão: ${formatDate(report.completedAt)}`, {
            align: "center",
          });

          doc.end();
        },
      }),
      {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      },
    );
  } catch (error) {
    console.error("[exit-pdf]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao gerar PDF",
      },
      { status: 500 },
    );
  }
}
