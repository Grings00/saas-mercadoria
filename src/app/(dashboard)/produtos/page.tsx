"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, Search, Package, Edit, Trash2, AlertTriangle,
  ChevronUp, ChevronDown, CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: string;
  category: { id: string; name: string } | null;
}

type SortKey = "name" | "stock" | "salePrice";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const justSaved = searchParams.get("saved") === "1";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const fetchProducts = useCallback(() => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/products${q}`)
      .then((r) => r.json())
      .then((d) => { setProducts(d); setLoading(false); });
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  const sorted = [...products].sort((a, b) => {
    let va: string | number, vb: string | number;
    if (sortKey === "name") { va = a.name; vb = b.name; }
    else if (sortKey === "stock") { va = a.stock; vb = b.stock; }
    else { va = a.salePrice; vb = b.salePrice; }
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
    setProducts((p) => p.filter((x) => x.id !== deleteId));
    setDeleteId(null);
    setDeleting(false);
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp className="w-3.5 h-3.5 text-slate-300" />;
    return sortAsc
      ? <ChevronUp className="w-3.5 h-3.5 text-primary-500" />
      : <ChevronDown className="w-3.5 h-3.5 text-primary-500" />;
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Produtos</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {products.length} produto{products.length !== 1 ? "s" : ""} cadastrado{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/produtos/novo" className="btn-primary">
          <Plus style={{ width: 16, height: 16 }} />
          Adicionar Produto
        </Link>
      </div>

      {justSaved && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800 font-medium">Produto cadastrado com sucesso!</p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto por nome..."
          className="input pl-10"
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Carregando...</div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-slate-400 gap-3">
            <Package className="w-10 h-10 text-slate-300" />
            <div className="text-center">
              <p className="font-medium text-slate-500">Nenhum produto encontrado</p>
              <p className="text-sm mt-1">
                {search ? "Tente uma busca diferente" : "Cadastre seu primeiro produto"}
              </p>
            </div>
            {!search && (
              <Link href="/produtos/novo" className="btn-primary mt-1">
                <Plus style={{ width: 16, height: 16 }} />
                Adicionar Produto
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500 w-12" />
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-slate-700">
                      Produto <SortIcon k="name" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">
                    <button onClick={() => toggleSort("stock")} className="flex items-center gap-1 ml-auto hover:text-slate-700">
                      Estoque <SortIcon k="stock" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">
                    <button onClick={() => toggleSort("salePrice")} className="flex items-center gap-1 ml-auto hover:text-slate-700">
                      Preço Venda <SortIcon k="salePrice" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Custo</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sorted.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2.5">
                        {p.imageUrl ? (
                          <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-slate-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {isLow && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                          <div>
                            <p className="font-medium text-slate-900">{p.name}</p>
                            {p.sku && <p className="text-xs text-slate-400">SKU: {p.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        {p.category ? (
                          <span className="badge-blue">{p.category.name}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={cn(
                          "font-semibold",
                          p.stock === 0 ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-900"
                        )}>
                          {p.stock} {p.unit}
                        </span>
                        {isLow && <p className="text-xs text-slate-400">mín: {p.minStock}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-right hidden sm:table-cell text-slate-900">
                        {formatCurrency(p.salePrice)}
                      </td>
                      <td className="px-4 py-2.5 text-right hidden lg:table-cell text-slate-500">
                        {formatCurrency(p.costPrice)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/produtos/${p.id}`} className="btn-ghost p-2">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="btn-ghost p-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remover produto"
        description="Este produto será removido do catálogo. As movimentações anteriores serão mantidas."
        confirmLabel="Remover"
        loading={deleting}
      />
    </div>
  );
}
