"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, Package, TrendingUp } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MonthData {
  month: string;
  entradas: number;
  saidas: number;
  qtdEntradas: number;
  qtdSaidas: number;
}

interface TopProduct {
  name: string;
  unit: string;
  totalMovimentos: number;
  totalQuantidade: number;
  totalValor: number;
}

interface LowStock {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  category: { name: string } | null;
}

interface ReportData {
  monthlyData: MonthData[];
  topProducts: TopProduct[];
  lowStockProducts: LowStock[];
}

const BRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-5xl">
        <div className="h-8 bg-slate-200 rounded w-32" />
        <div className="card h-64" />
        <div className="grid grid-cols-2 gap-4">
          <div className="card h-48" />
          <div className="card h-48" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const lowStockCritical = data.lowStockProducts.filter((p) => p.stock === 0);
  const lowStockWarn = data.lowStockProducts.filter((p) => p.stock > 0 && p.stock <= p.minStock);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Relatórios</h1>
        <p className="text-sm text-slate-500 mt-0.5">Visão geral do desempenho do seu estoque</p>
      </div>

      {/* Monthly chart */}
      <div className="card p-5">
        <h2 className="font-medium text-slate-900 mb-4">Movimentações dos Últimos 6 Meses (R$)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number, name: string) => [formatCurrency(v), name === "entradas" ? "Entradas" : "Saídas"]}
                labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              />
              <Legend
                formatter={(v) => v === "entradas" ? "Entradas" : "Saídas"}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="entradas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="saidas" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top products */}
        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <TrendingUp className="w-4 h-4 text-primary-600" />
            <h2 className="font-medium text-slate-900">Produtos Mais Movimentados</h2>
          </div>
          {data.topProducts.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              Nenhum dado disponível ainda
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {data.topProducts.slice(0, 8).map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{formatNumber(p.totalQuantidade)} {p.unit} movimentados</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(p.totalValor)}</p>
                    <p className="text-xs text-slate-400">{p.totalMovimentos} mov.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="font-medium text-slate-900">Produtos com Estoque Baixo</h2>
          </div>
          {data.lowStockProducts.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Package className="w-8 h-8 text-green-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Todos os produtos estão com estoque adequado</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {[...lowStockCritical, ...lowStockWarn].map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    p.stock === 0 ? "bg-red-500" : "bg-amber-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">
                      {p.category?.name || "Sem categoria"} • mín: {p.minStock} {p.unit}
                    </p>
                  </div>
                  <span className={cn(
                    "text-sm font-bold shrink-0",
                    p.stock === 0 ? "text-red-600" : "text-amber-600"
                  )}>
                    {p.stock} {p.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Entradas (6m)", value: formatCurrency(data.monthlyData.reduce((s, m) => s + m.entradas, 0)), color: "text-green-600" },
          { label: "Total Saídas (6m)", value: formatCurrency(data.monthlyData.reduce((s, m) => s + m.saidas, 0)), color: "text-orange-600" },
          { label: "Itens sem Estoque", value: String(lowStockCritical.length), color: "text-red-600" },
          { label: "Estoque Baixo", value: String(lowStockWarn.length), color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className={cn("text-xl font-bold mt-1", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
