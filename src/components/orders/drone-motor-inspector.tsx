"use client";

import * as React from "react";
import { AlertCircle, Zap, Activity, TrendingUp } from "lucide-react";

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

  const getMotorColor = (status: MotorStatus["status"]) => {
    switch (status) {
      case "OK":
        return "#10b981"; // green
      case "COM_FALHA":
        return "#ef4444"; // red
      case "AQUECIMENTO":
        return "#f59e0b"; // amber
      case "VIBRACAO":
        return "#f59e0b"; // amber
      case "RUIDO":
        return "#f59e0b"; // amber
      case "OUTRO":
        return "#8b5cf6"; // purple
      default:
        return "#d1d5db"; // gray
    }
  };

  const getStatusLabel = (status: MotorStatus["status"]) => {
    const labels: Record<MotorStatus["status"], string> = {
      OK: "✅ OK",
      COM_FALHA: "❌ Falha",
      AQUECIMENTO: "🔥 Aquecimento",
      VIBRACAO: "📳 Vibração",
      RUIDO: "🔊 Ruído",
      OUTRO: "❓ Outro",
    };
    return labels[status];
  };

  return (
    <div className="space-y-6">
      {/* SVG do Drone DJI T40 */}
      <div className="flex justify-center bg-gray-50 p-8 rounded-lg border border-gray-200">
        <svg viewBox="0 0 400 400" width="280" height="280" className="drop-shadow-lg">
          {/* Corpo principal */}
          <ellipse cx="200" cy="200" rx="60" ry="50" fill="#1f2937" stroke="#111827" strokeWidth="2" />

          {/* Braços */}
          <line x1="200" y1="200" x2="80" y2="100" stroke="#374151" strokeWidth="6" />
          <line x1="200" y1="200" x2="320" y2="100" stroke="#374151" strokeWidth="6" />
          <line x1="200" y1="200" x2="80" y2="300" stroke="#374151" strokeWidth="6" />
          <line x1="200" y1="200" x2="320" y2="300" stroke="#374151" strokeWidth="6" />

          {/* Motor 1 (esquerda superior) */}
          <g>
            <circle
              cx="80"
              cy="100"
              r="18"
              fill={getMotorColor(motorStatus[0]?.status || "OK")}
              stroke="#111827"
              strokeWidth="2"
            />
            <text
              x="80"
              y="106"
              textAnchor="middle"
              fontSize="18"
              fontWeight="bold"
              fill="white"
            >
              1
            </text>
          </g>

          {/* Motor 2 (direita superior) */}
          <g>
            <circle
              cx="320"
              cy="100"
              r="18"
              fill={getMotorColor(motorStatus[1]?.status || "OK")}
              stroke="#111827"
              strokeWidth="2"
            />
            <text
              x="320"
              y="106"
              textAnchor="middle"
              fontSize="18"
              fontWeight="bold"
              fill="white"
            >
              2
            </text>
          </g>

          {/* Motor 3 (esquerda inferior) */}
          <g>
            <circle
              cx="80"
              cy="300"
              r="18"
              fill={getMotorColor(motorStatus[2]?.status || "OK")}
              stroke="#111827"
              strokeWidth="2"
            />
            <text
              x="80"
              y="306"
              textAnchor="middle"
              fontSize="18"
              fontWeight="bold"
              fill="white"
            >
              3
            </text>
          </g>

          {/* Motor 4 (direita inferior) */}
          <g>
            <circle
              cx="320"
              cy="300"
              r="18"
              fill={getMotorColor(motorStatus[3]?.status || "OK")}
              stroke="#111827"
              strokeWidth="2"
            />
            <text
              x="320"
              y="306"
              textAnchor="middle"
              fontSize="18"
              fontWeight="bold"
              fill="white"
            >
              4
            </text>
          </g>

          {/* Câmera */}
          <ellipse cx="200" cy="210" rx="10" ry="15" fill="#7c3aed" stroke="#111827" strokeWidth="1.5" />

          {/* Leds de posição */}
          <circle cx="70" cy="85" r="3" fill="#ff6b6b" />
          <circle cx="330" cy="85" r="3" fill="#51cf66" />
        </svg>
      </div>

      {/* Legenda de cores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span className="text-xs sm:text-sm">OK</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span className="text-xs sm:text-sm">Falha</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-500"></div>
          <span className="text-xs sm:text-sm">Aviso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-500"></div>
          <span className="text-xs sm:text-sm">Outro</span>
        </div>
      </div>

      {/* Controles para cada motor */}
      <div className="space-y-4">
        {motorStatus.map((motor) => (
          <div key={motor.number} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">
                Motor {motor.number}
              </h4>
              <span
                className="text-xs font-bold px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: getMotorColor(motor.status) }}
              >
                {getStatusLabel(motor.status)}
              </span>
            </div>

            {/* Botões de status */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  "OK",
                  "COM_FALHA",
                  "AQUECIMENTO",
                  "VIBRACAO",
                  "RUIDO",
                  "OUTRO",
                ] as const
              ).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(motor.number, status)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    motor.status === status
                      ? "ring-2 ring-offset-2 ring-blue-500 font-bold"
                      : "hover:bg-gray-100"
                  }`}
                  style={{
                    backgroundColor:
                      motor.status === status
                        ? getMotorColor(status)
                        : "#f3f4f6",
                    color: motor.status === status ? "white" : "#374151",
                  }}
                >
                  {getStatusLabel(status).split(" ")[1] || getStatusLabel(status)}
                </button>
              ))}
            </div>

            {/* Campo de notas se houver problema */}
            {motor.status !== "OK" && (
              <textarea
                value={motor.notes || ""}
                onChange={(e) => handleNotesChange(motor.number, e.target.value)}
                placeholder={`Descreva o problema do Motor ${motor.number}...`}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            )}
          </div>
        ))}
      </div>

      {/* Resumo de status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <h4 className="font-semibold text-sm text-blue-900">📊 Resumo</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>
              OK: {motorStatus.filter((m) => m.status === "OK").length}/{motorCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span>
              Falhas: {motorStatus.filter((m) => m.status === "COM_FALHA").length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span>
              Avisos:{" "}
              {
                motorStatus.filter((m) =>
                  ["AQUECIMENTO", "VIBRACAO", "RUIDO"].includes(m.status),
                ).length
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            <span>
              Outros: {motorStatus.filter((m) => m.status === "OUTRO").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
