"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, TrendingUp, TrendingDown, CheckCircle2, AlertCircle } from "lucide-react";
import { ProductForm, type ProductFormData } from "@/components/products/ProductForm";
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
}

interface ProductData {
  id: string;
  name: string;
  description?: string;
  sku: string | null;
  barcode?: string;
  imageUrl?: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: string;
  category: { id: string; name: string } | null;
  movements: Movement[];
}

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => { setProduct(d); setLoading(false); });
  }, [id]);

  async function handleSubmit(data: ProductFormData, imageFile?: File | null) {
    setStatus(null);

    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setStatus({ type: "error", msg: err.error || "Erro ao atualizar produto. Tente novamente." });
      return;
    }

    // Upload image if a new one was selected
    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("productId", id);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (uploadRes.ok) {
        const { imageUrl } = await uploadRes.json();
        setProduct((prev) => prev ? { ...prev, imageUrl } : prev);
      } else {
        const uploadErr = await uploadRes.json().catch(() => ({}));
        setStatus({ type: "error", msg: `Produto salvo, mas erro ao enviar imagem: ${uploadErr.error || "Tente novamente."}` });
        return;
      }
    }

    setStatus({ type: "success", msg: "Produto atualizado com sucesso!" });
    const updated = await res.json().catch(() => null);
    if (updated) setProduct((prev) => prev ? { ...prev, ...updated } : prev);
  }

  if (loading) {
    return (
      <div className="max-w-2xl animate-pulse space-y-5">
        <div className="h-6 bg-slate-200 rounded w-32" />
        <div className="card p-6 h-96" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Produto não encontrado.</p>
        <Link href="/produtos" className="text-primary-600 hover:underline text-sm mt-2 block">
          Voltar para Produtos
        </Link>
      </div>
    );
  }

  const defaultValues: Partial<ProductFormData> = {
    name: product.name,
    description: product.description || "",
    sku: product.sku || "",
    barcode: product.barcode || "",
    categoryId: product.category?.id || "",
    costPrice: product.costPrice,
    salePrice: product.salePrice,
    stock: product.stock,
    minStock: product.minStock,
    unit: product.unit,
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link href="/produtos" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="w-4 h-4" />
          Voltar para Produtos
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">Editar Produto</h1>
        <p className="text-sm text-slate-500 mt-0.5">{product.name}</p>
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
        <ProductForm
          defaultValues={defaultValues}
          defaultImageUrl={product.imageUrl || undefined}
          onSubmit={handleSubmit}
          submitLabel="Salvar Alterações"
        />
      </div>

      {product.movements.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-medium text-slate-900">Histórico de Movimentações</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {product.movements.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-5 py-3">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  m.type === "ENTRADA" ? "bg-green-100" : "bg-orange-100"
                )}>
                  {m.type === "ENTRADA"
                    ? <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                    : <TrendingDown className="w-3.5 h-3.5 text-orange-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {m.type === "ENTRADA" ? "Entrada" : "Saída"} de {m.quantity} {product.unit}
                  </p>
                  <p className="text-xs text-slate-400">{formatDateTime(m.createdAt)}</p>
                  {m.notes && <p className="text-xs text-slate-500 mt-0.5">{m.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-sm font-medium",
                    m.type === "ENTRADA" ? "text-green-600" : "text-orange-600"
                  )}>
                    {formatCurrency(m.totalValue)}
                  </p>
                  {m.unitPrice > 0 && (
                    <p className="text-xs text-slate-400">{formatCurrency(m.unitPrice)}/un</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
