"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Plus, Filter } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Movement {
  id: string;
  type: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  notes: string | null;
  createdAt: string;
  product: { id: string; name: string; unit: string };
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"" | "ENTRADA" | "SAIDA">("");
  const [loading, setLoading] = useState(true);

  const fetchMovements = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      ...(typeFilter && { type: typeFilter }),
    });
    fetch(`/api/movements?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setMovements(d.movements);
        setTotal(d.total);
        setLoading(false);
      });
  }, [page, typeFilter]);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Movimentações</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} registro{total !== 1 ? "s" : ""} no total</p>
        </div>
        <div className="flex gap-2">
          <Link href="/movimentacoes/entrada" className="btn-primary">
            <TrendingUp style={{ width: 16, height: 16 }} />
            Entrada
          </Link>
          <Link href="/movimentacoes/saida" className="btn-secondary">
            <TrendingDown style={{ width: 16, height: 16 }} />
            Saída
          </Link>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["", "ENTRADA", "SAIDA"] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setTypeFilter(f); setPage(1); }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
              typeFilter === f
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            {f === "" ? "Todos" : f === "ENTRADA" ? "Entradas" : "Saídas"}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Carregando...</div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-slate-400 gap-3">
            <Filter className="w-10 h-10 text-slate-300" />
            <div className="text-center">
              <p className="font-medium text-slate-500">Nenhuma movimentação encontrada</p>
              <p className="text-sm mt-1">Registre entradas ou saídas de produtos</p>
            </div>
            <div className="flex gap-2 mt-1">
              <Link href="/movimentacoes/entrada" className="btn-primary">
                <Plus style={{ width: 16, height: 16 }} />
                Registrar Entrada
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Tipo</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Produto</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">Qtd</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Valor Unit.</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">Total</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                          m.type === "ENTRADA"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        )}>
                          {m.type === "ENTRADA"
                            ? <TrendingUp className="w-3 h-3" />
                            : <TrendingDown className="w-3 h-3" />
                          }
                          {m.type === "ENTRADA" ? "Entrada" : "Saída"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{m.product.name}</p>
                        {m.notes && <p className="text-xs text-slate-400 truncate max-w-[200px]">{m.notes}</p>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {m.quantity} {m.product.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell">
                        {m.unitPrice > 0 ? formatCurrency(m.unitPrice) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          "font-semibold",
                          m.type === "ENTRADA" ? "text-green-600" : "text-orange-600"
                        )}>
                          {formatCurrency(m.totalValue)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 text-xs hidden md:table-cell">
                        {formatDateTime(m.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
