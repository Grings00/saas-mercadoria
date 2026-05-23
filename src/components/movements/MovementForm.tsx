"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const schema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  quantity: z.coerce.number().int().min(1, "Quantidade deve ser ao menos 1"),
  unitPrice: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

type Form = z.infer<typeof schema>;

interface Product {
  id: string;
  name: string;
  stock: number;
  unit: string;
  costPrice: number;
  salePrice: number;
  category: { name: string } | null;
}

export interface MovementFormData {
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  type: string;
}

interface MovementFormProps {
  type: "ENTRADA" | "SAIDA";
  onSubmit: (data: MovementFormData) => Promise<void>;
}

export function MovementForm({ type, onSubmit }: MovementFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const quantity = watch("quantity");
  const unitPrice = watch("unitPrice");
  const total = (quantity || 0) * (unitPrice || 0);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = search ? `?search=${encodeURIComponent(search)}` : "";
      fetch(`/api/products${q}`)
        .then((r) => r.json())
        .then(setProducts);
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  function selectProduct(p: Product) {
    setSelected(p);
    setValue("productId", p.id);
    if (type === "ENTRADA") setValue("unitPrice", p.costPrice);
    else setValue("unitPrice", p.salePrice);
    setSearch(p.name);
    setShowDropdown(false);
  }

  async function handleFormSubmit(data: Form) {
    await onSubmit({ ...data, type });
  }

  const filteredProducts = products.filter((p) =>
    type === "SAIDA" ? p.stock > 0 : true
  );

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Product search */}
      <div>
        <label className="label">Produto *</label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); setSelected(null); setValue("productId", ""); }}
            onFocus={() => setShowDropdown(true)}
            className="input pl-10"
            placeholder="Buscar produto por nome..."
            autoComplete="off"
          />
          <input type="hidden" {...register("productId")} />
          {showDropdown && filteredProducts.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 z-20 max-h-64 overflow-y-auto">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectProduct(p)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">
                      Estoque: {p.stock} {p.unit}
                      {p.category && ` • ${p.category.name}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500">{formatCurrency(p.salePrice)}</p>
                    {type === "SAIDA" && p.stock === 0 && (
                      <p className="text-xs text-red-500">Sem estoque</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {errors.productId && <p className="text-xs text-red-500 mt-1">{errors.productId.message}</p>}

        {/* Selected product info */}
        {selected && (
          <div className={cn(
            "mt-2 p-3 rounded-lg border text-sm",
            type === "SAIDA" && selected.stock === 0
              ? "bg-red-50 border-red-200"
              : "bg-slate-50 border-slate-200"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Estoque atual:</span>
              <span className={cn(
                "font-semibold",
                selected.stock === 0 ? "text-red-600" : "text-slate-900"
              )}>
                {selected.stock} {selected.unit}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-slate-600">Preço {type === "ENTRADA" ? "custo" : "venda"}:</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(type === "ENTRADA" ? selected.costPrice : selected.salePrice)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Quantidade *</label>
          <input
            {...register("quantity")}
            type="number"
            min="1"
            className="input"
            placeholder="1"
          />
          {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
          {type === "SAIDA" && selected && quantity > selected.stock && (
            <p className="text-xs text-red-500 mt-1">
              Quantidade maior que o estoque disponível ({selected.stock} {selected.unit})
            </p>
          )}
        </div>

        <div>
          <label className="label">
            Valor Unitário (R$)
            <span className="text-slate-400 font-normal ml-1">• opcional</span>
          </label>
          <input
            {...register("unitPrice")}
            type="number"
            step="0.01"
            min="0"
            className="input"
            placeholder="0,00"
          />
        </div>
      </div>

      {/* Total preview */}
      {total > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-slate-600">Valor Total da Operação</span>
          <span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
        </div>
      )}

      <div>
        <label className="label">Observação <span className="text-slate-400 font-normal">• opcional</span></label>
        <input
          {...register("notes")}
          className="input"
          placeholder={type === "ENTRADA" ? "Ex: Compra do fornecedor XYZ" : "Ex: Venda para cliente"}
        />
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
        ) : (
          `Registrar ${type === "ENTRADA" ? "Entrada" : "Saída"}`
        )}
      </button>
    </form>
  );
}
