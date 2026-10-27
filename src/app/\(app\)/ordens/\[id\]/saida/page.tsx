"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { DroneMotorInspector } from "@/components/orders/drone-motor-inspector";
import { createExitReportAction } from "@/server/actions/service-order-exit";

type ReplacedPart = {
  partName: string;
  description?: string;
  quantity: number;
};

type FormState = {
  ok: boolean;
  error?: string;
  reportId?: string;
};

export default function ExitChecklist({ params }: { params: { id: string } }) {
  const toast = useToast();
  const [state, formAction] = useActionState<FormState, FormData>(
    createExitReportAction,
    null,
  );

  const [replacedParts, setReplacedParts] = React.useState<ReplacedPart[]>([]);
  const [motorStatus, setMotorStatus] = React.useState([]);
  const [finalNotes, setFinalNotes] = React.useState("");
  const [issuesFound, setIssuesFound] = React.useState("");

  const handleAddPart = () => {
    setReplacedParts([
      ...replacedParts,
      { partName: "", description: "", quantity: 1 },
    ]);
  };

  const handleRemovePart = (index: number) => {
    setReplacedParts(replacedParts.filter((_, i) => i !== index));
  };

  const handlePartChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const updated = [...replacedParts];
    updated[index] = { ...updated[index], [field]: value };
    setReplacedParts(updated);
  };

  const handleSubmit = async (formData: FormData) => {
    formData.set("serviceOrderId", params.id);
    formData.set("replacedParts", JSON.stringify(replacedParts));
    formData.set("motorStatus", JSON.stringify(motorStatus));
    formData.set("finalNotes", finalNotes);
    formData.set("issuesFound", issuesFound);

    formAction(formData);
  };

  React.useEffect(() => {
    if (state?.ok) {
      toast("Relatório de saída criado com sucesso!", "success");
    } else if (state?.error) {
      toast(state.error, "error");
    }
  }, [state, toast]);

  return (
    <>
      <PageHeader
        title="Checklist de Saída"
        description="Preencha o formulário de finalização do serviço"
      />

      <form action={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Seção 1: Peças Trocadas */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">🔧 Peças Trocadas/Reparadas</h3>
            <Button
              type="button"
              onClick={handleAddPart}
              size="sm"
              variant="secondary"
            >
              <Plus className="h-4 w-4" />
              Adicionar Peça
            </Button>
          </div>

          <div className="space-y-3">
            {replacedParts.map((part, index) => (
              <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder="Nome da peça (ex: Motor 1, Bateria, Propeleres)"
                    value={part.partName}
                    onChange={(e) =>
                      handlePartChange(index, "partName", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Descrição/Motivo"
                    value={part.description || ""}
                    onChange={(e) =>
                      handlePartChange(index, "description", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Quantidade"
                    value={part.quantity}
                    onChange={(e) =>
                      handlePartChange(index, "quantity", parseInt(e.target.value))
                    }
                    min="1"
                    className="w-20 px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePart(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {replacedParts.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                Nenhuma peça adicionada. Clique em "Adicionar Peça" se houve trocas.
              </p>
            )}
          </div>
        </Card>

        {/* Seção 2: Inspeção de Motores */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">🚁 Inspeção de Motores (DJI T40)</h3>
          <DroneMotorInspector
            motorCount={4}
            onStatusChange={setMotorStatus}
          />
        </Card>

        {/* Seção 3: Observações */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">📝 Observações Finais</h3>
          <textarea
            value={finalNotes}
            onChange={(e) => setFinalNotes(e.target.value)}
            placeholder="Anotações gerais sobre o serviço realizado..."
            rows={4}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </Card>

        {/* Seção 4: Problemas Encontrados */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">⚠️ Problemas Encontrados (opcional)</h3>
          <textarea
            value={issuesFound}
            onChange={(e) => setIssuesFound(e.target.value)}
            placeholder="Descreva qualquer problema ou dano encontrado no equipamento..."
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </Card>

        {/* Botões de ação */}
        <div className="flex gap-3">
          <Button type="submit" size="lg" className="gap-2">
            <FileText className="h-4 w-4" />
            Gerar Relatório PDF
          </Button>
          <Button type="button" variant="secondary" size="lg">
            Cancelar
          </Button>
        </div>
      </form>
    </>
  );
}
