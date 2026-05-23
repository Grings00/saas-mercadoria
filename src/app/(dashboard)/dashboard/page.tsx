"use client";

import { useEffect, useState } from "react";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowRight,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DashboardData {
  totalProducts: number;
  lowStockProducts: number;
  monthEntries: number;
  monthExits: number;
  totalStockValue: number;
  monthEntriesValue: number;
  monthExitsValue: number;
  recentMovements: Array<{
    type: string;
    quantity: number;
    totalValue: number;
    createdAt: string;
    product: { name: string };
  }>;
}

function KPICard({
  title,
  value,
  sub,
  icon: Icon,
  color,
  alert,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  alert?: boolean;
}) {
  return (
    <div className={cn("card p-5", alert && "border-red-200 bg-red-50/30")}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={cn("text-2xl font-bold mt-1", alert ? "text-red-600" : "text-slate-900")}>
            {value}
          </p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
          <Icon style={{ width: 20, height: 20 }} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-5 h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Painel</h1>
          <p className="text-sm text-slate-500 mt-0.5">Resumo do seu estoque</p>
        </div>
        <div className="flex gap-2">
          <Link href="/movimentacoes/entrada" className="btn-primary">
            <Plus style={{ width: 16, height: 16 }} />
            Entrada
          </Link>
          <Link href="/movimentacoes/saida" className="btn-secondary">
            <TrendingDown style={{ width: 16, height: 16 }} />
            Saída
          </Link>
        </div>
      </div>

      {/* Low stock alert */}
      {data.lowStockProducts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{data.lowStockProducts} produto{data.lowStockProducts > 1 ? "s" : ""}</strong>{" "}
            com estoque baixo ou zerado.{" "}
            <Link href="/relatorios" className="underline font-medium">
              Ver relatório
            </Link>
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Produtos"
          value={String(data.totalProducts)}
          sub="produtos ativos"
          icon={Package}
          color="bg-primary-500"
        />
        <KPICard
          title="Estoque Baixo"
          value={String(data.lowStockProducts)}
          sub="abaixo do mínimo"
          icon={AlertTriangle}
          color={data.lowStockProducts > 0 ? "bg-red-500" : "bg-slate-400"}
          alert={data.lowStockProducts > 0}
        />
        <KPICard
          title="Entradas do Mês"
          value={String(data.monthEntries)}
          sub={formatCurrency(data.monthEntriesValue)}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <KPICard
          title="Saídas do Mês"
          value={String(data.monthExits)}
          sub={formatCurrency(data.monthExitsValue)}
          icon={TrendingDown}
          color="bg-orange-500"
        />
      </div>

      {/* Stock value */}
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
            <DollarSign style={{ width: 20, height: 20 }} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Valor Total em Estoque</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.totalStockValue)}</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/produtos/novo" className="card p-4 flex items-center gap-3 hover:border-primary-300 hover:bg-primary-50/30 transition-colors group">
          <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
            <Package className="w-4 h-4 text-primary-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Adicionar Produto</p>
            <p className="text-xs text-slate-400">Cadastrar novo item no estoque</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-400" />
        </Link>

        <Link href="/movimentacoes/entrada" className="card p-4 flex items-center gap-3 hover:border-green-300 hover:bg-green-50/30 transition-colors group">
          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Registrar Entrada</p>
            <p className="text-xs text-slate-400">Recebimento de mercadorias</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-green-400" />
        </Link>

        <Link href="/movimentacoes/saida" className="card p-4 flex items-center gap-3 hover:border-orange-300 hover:bg-orange-50/30 transition-colors group">
          <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
            <TrendingDown className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Registrar Saída</p>
            <p className="text-xs text-slate-400">Venda ou consumo de itens</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-400" />
        </Link>
      </div>

      {/* Recent movements */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-medium text-slate-900">Movimentações Recentes</h2>
          <Link href="/movimentacoes" className="text-sm text-primary-600 hover:underline">
            Ver todas
          </Link>
        </div>
        {data.recentMovements.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">
            Nenhuma movimentação registrada ainda.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {data.recentMovements.map((m, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    m.type === "ENTRADA" ? "bg-green-100" : "bg-orange-100"
                  )}
                >
                  {m.type === "ENTRADA" ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-orange-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{m.product.name}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(m.createdAt)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      m.type === "ENTRADA" ? "text-green-600" : "text-orange-600"
                    )}
                  >
                    {m.type === "ENTRADA" ? "+" : "-"}{m.quantity} un
                  </p>
                  <p className="text-xs text-slate-400">{formatCurrency(m.totalValue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
