"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  costPrice: z.coerce.number().min(0, "Valor inválido"),
  salePrice: z.coerce.number().min(0, "Valor inválido"),
  stock: z.coerce.number().int().min(0, "Quantidade inválida"),
  minStock: z.coerce.number().int().min(0, "Quantidade inválida"),
  unit: z.string().default("un"),
});

export type ProductFormData = z.infer<typeof schema>;

const UNITS = ["un", "kg", "g", "L", "mL", "cx", "pç", "m", "cm"];

interface Category { id: string; name: string }

interface ProductFormProps {
  defaultValues?: Partial<ProductFormData>;
  defaultImageUrl?: string;
  onSubmit: (data: ProductFormData, imageFile?: File | null) => Promise<void>;
  submitLabel?: string;
}

export function ProductForm({ defaultValues, defaultImageUrl, onSubmit, submitLabel = "Salvar" }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatModal, setNewCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(defaultImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: { unit: "un", stock: 0, minStock: 5, costPrice: 0, salePrice: 0, ...defaultValues },
  });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Imagem muito grande. Máximo 3MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function createCategory() {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName }),
    });
    if (res.ok) {
      const cat = await res.json();
      setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
      setValue("categoryId", cat.id);
      setNewCatName("");
      setNewCatModal(false);
    }
    setSavingCat(false);
  }

  async function handleFormSubmit(data: ProductFormData) {
    await onSubmit(data, imageFile);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Image upload */}
      <div>
        <p className="label">Foto do Produto</p>
        <div className="flex items-start gap-4">
          {imagePreview ? (
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0">
              <Image
                src={imagePreview}
                alt="Prévia"
                fill
                className="object-cover"
                unoptimized={imagePreview.startsWith("blob:")}
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-primary-400 hover:text-primary-500 transition-colors shrink-0"
            >
              <ImagePlus className="w-6 h-6" />
              <span className="text-xs font-medium">Foto</span>
            </button>
          )}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
            {!imagePreview && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-xs"
              >
                Selecionar imagem
              </button>
            )}
            <p className="text-xs text-slate-400 mt-1.5">JPG, PNG ou WebP. Máximo 3MB.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4" />

      {/* Basic info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label">Nome do Produto *</label>
          <input {...register("name")} className="input" placeholder="Ex: Arroz Tipo 1 5kg" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">SKU / Código Interno</label>
          <input {...register("sku")} className="input" placeholder="Ex: ARR001" />
        </div>

        <div>
          <label className="label">Código de Barras</label>
          <input {...register("barcode")} className="input" placeholder="Ex: 7891000315507" />
        </div>

        <div>
          <label className="label">Categoria</label>
          <div className="flex gap-2">
            <select {...register("categoryId")} className="input flex-1">
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="button" onClick={() => setNewCatModal(true)} className="btn-secondary px-3">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="label">Unidade de Medida</label>
          <select {...register("unit")} className="input">
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="label">Descrição</label>
          <textarea
            {...register("description")}
            className="input resize-none"
            rows={2}
            placeholder="Descrição opcional do produto"
          />
        </div>
      </div>

      {/* Prices */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">Preços</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Preço de Custo (R$)</label>
            <input {...register("costPrice")} type="number" step="0.01" min="0" className="input" placeholder="0.00" />
            {errors.costPrice && <p className="text-xs text-red-500 mt-1">{errors.costPrice.message}</p>}
          </div>
          <div>
            <label className="label">Preço de Venda (R$)</label>
            <input {...register("salePrice")} type="number" step="0.01" min="0" className="input" placeholder="0.00" />
            {errors.salePrice && <p className="text-xs text-red-500 mt-1">{errors.salePrice.message}</p>}
          </div>
        </div>
      </div>

      {/* Stock */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">Estoque</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Quantidade Atual</label>
            <input {...register("stock")} type="number" min="0" className="input" placeholder="0" />
            {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>}
          </div>
          <div>
            <label className="label">Estoque Mínimo</label>
            <input {...register("minStock")} type="number" min="0" className="input" placeholder="5" />
            {errors.minStock && <p className="text-xs text-red-500 mt-1">{errors.minStock.message}</p>}
            <p className="text-xs text-slate-400 mt-1">Alerta quando atingir este valor</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : submitLabel}
        </button>
      </div>

      {/* New category modal */}
      <Modal open={newCatModal} onClose={() => setNewCatModal(false)} title="Nova Categoria" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Nome da Categoria</label>
            <input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="input"
              placeholder="Ex: Alimentos"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createCategory(); } }}
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setNewCatModal(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="button" onClick={createCategory} disabled={savingCat} className="btn-primary flex-1">
              {savingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
            </button>
          </div>
        </div>
      </Modal>
    </form>
  );
}
