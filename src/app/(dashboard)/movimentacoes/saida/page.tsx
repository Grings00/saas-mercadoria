"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, TrendingDown, CheckCircle2, AlertCircle } from "lucide-react";
import { MovementForm } from "@/components/movements/MovementForm";

export default function SaidaPage() {
  const router = useRouter();
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleSubmit(data: {
    productId: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
    type: string;
  }) {
    setStatus(null);
    const res = await fetch("/api/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setStatus({ type: "success", msg: "Saída registrada com sucesso!" });
      setTimeout(() => router.push("/movimentacoes"), 1500);
    } else {
      const err = await res.json().catch(() => ({}));
      setStatus({ type: "error", msg: err.error || "Erro ao registrar saída" });
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <Link href="/movimentacoes" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="w-4 h-4" />
          Voltar para Movimentações
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Registrar Saída</h1>
            <p className="text-sm text-slate-500">Venda, consumo ou perda de itens do estoque</p>
          </div>
        </div>
      </div>

      {status && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${
          status.type === "success"
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {status.type === "success"
            ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          }
          <p className="text-sm font-medium">{status.msg}</p>
        </div>
      )}

      <div className="card p-6">
        <MovementForm type="SAIDA" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
