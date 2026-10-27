"use client";

import * as React from "react";

interface MotorStatus {
  number: number;
  status: "OK" | "COM_FALHA" | "AQUECIMENTO" | "VIBRACAO" | "RUIDO" | "OUTRO";
  notes?: string;
}

export function DroneMotorInspector({
  motorCount = 4,
  onStatusChange,
  initialStatus = [],
}: {
  motorCount?: number;
  onStatusChange?: (status: MotorStatus[]) => void;
  initialStatus?: MotorStatus[];
}) {
  const [motorStatus, setMotorStatus] = React.useState<MotorStatus[]>(
    initialStatus.length > 0
      ? initialStatus
      : Array.from({ length: motorCount }, (_, i) => ({
          number: i + 1,
          status: "OK" as const,
        })),
  );

  const handleStatusChange = (motorNumber: number, newStatus: MotorStatus["status"]) => {
    const updated = motorStatus.map((m) =>
      m.number === motorNumber ? { ...m, status: newStatus } : m,
    );
    setMotorStatus(updated);
    onStatusChange?.(updated);
  };

  const handleNotesChange = (motorNumber: number, notes: string) => {
    const updated = motorStatus.map((m) =>
      m.number === motorNumber ? { ...m, notes } : m,
    );
    setMotorStatus(updated);
    onStatusChange?.(updated);
  };

  const statusOptions = [
    { value: "OK", label: "OK" },
    { value: "COM_FALHA", label: "Falha" },
    { value: "AQUECIMENTO", label: "Aquecimento" },
    { value: "VIBRACAO", label: "Vibração" },
    { value: "RUIDO", label: "Ruído" },
    { value: "OUTRO", label: "Outro" },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Tabela simples de motores */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-3 text-left font-medium text-gray-700">Motor</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Observações</th>
            </tr>
          </thead>
          <tbody>
            {motorStatus.map((motor, idx) => (
              <React.Fragment key={motor.number}>
                <tr className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 font-medium">Motor {motor.number}</td>
                  <td className="px-4 py-3">
                    <select
                      value={motor.status}
                      onChange={(e) =>
                        handleStatusChange(motor.number, e.target.value as MotorStatus["status"])
                      }
                      className="block w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {motor.status !== "OK" && (
                      <input
                        type="text"
                        value={motor.notes || ""}
                        onChange={(e) => handleNotesChange(motor.number, e.target.value)}
                        placeholder="Descrição do problema"
                        className="block w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    )}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumo simples */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-green-50 p-3 rounded border border-green-200">
          <div className="text-xs text-gray-600">OK</div>
          <div className="text-lg font-bold text-green-700">
            {motorStatus.filter((m) => m.status === "OK").length}/{motorCount}
          </div>
        </div>
        <div className="bg-red-50 p-3 rounded border border-red-200">
          <div className="text-xs text-gray-600">Falhas</div>
          <div className="text-lg font-bold text-red-700">
            {motorStatus.filter((m) => m.status === "COM_FALHA").length}
          </div>
        </div>
        <div className="bg-amber-50 p-3 rounded border border-amber-200">
          <div className="text-xs text-gray-600">Avisos</div>
          <div className="text-lg font-bold text-amber-700">
            {motorStatus.filter((m) =>
              ["AQUECIMENTO", "VIBRACAO", "RUIDO"].includes(m.status),
            ).length}
          </div>
        </div>
        <div className="bg-purple-50 p-3 rounded border border-purple-200">
          <div className="text-xs text-gray-600">Outros</div>
          <div className="text-lg font-bold text-purple-700">
            {motorStatus.filter((m) => m.status === "OUTRO").length}
          </div>
        </div>
      </div>
    </div>
  );
}
