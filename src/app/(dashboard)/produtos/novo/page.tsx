"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, AlertCircle } from "lucide-react";
import { ProductForm, type ProductFormData } from "@/components/products/ProductForm";

export default function NewProductPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(data: ProductFormData, imageFile?: File | null) {
    setError("");

    // 1. Create the product
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || "Erro ao cadastrar produto. Tente novamente.");
      return;
    }

    const product = await res.json();

    // 2. Upload image if provided
    if (imageFile && product.id) {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("productId", product.id);
      await fetch("/api/upload", { method: "POST", body: formData });
    }

    router.push("/produtos?saved=1");
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link href="/produtos" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="w-4 h-4" />
          Voltar para Produtos
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">Adicionar Produto</h1>
        <p className="text-sm text-slate-500 mt-0.5">Cadastre um novo item no seu estoque</p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="card p-6">
        <ProductForm onSubmit={handleSubmit} submitLabel="Cadastrar Produto" />
      </div>
    </div>
  );
}
