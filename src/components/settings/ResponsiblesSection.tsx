"use client";

import { useEffect, useState } from "react";
import { Loader2, UserCheck, Plus, Trash2 } from "lucide-react";

interface Responsible {
  id: string;
  name: string;
  role: string | null;
}

export function ResponsiblesSection() {
  const [items, setItems] = useState<Responsible[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/responsibles");
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Informe o nome");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/responsibles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), role: role.trim() || undefined }),
    });
    setSaving(false);
    if (res.ok) {
      setName("");
      setRole("");
      await load();
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.error || "Erro ao salvar");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este responsável? O histórico de saídas será preservado.")) return;
    setDeletingId(id);
    const res = await fetch(`/api/responsibles/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) await load();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
          <UserCheck className="w-4 h-4 text-primary-600" />
        </div>
        <div>
          <h2 className="font-medium text-slate-900">Responsáveis</h2>
          <p className="text-xs text-slate-500">Quem registrou cada saída (vendedor, caixa, etc.)</p>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="py-6 text-center text-sm text-slate-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="py-6 text-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg">
          Nenhum responsável cadastrado ainda.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 mb-5">
          {items.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{r.name}</p>
                {r.role && <p className="text-xs text-slate-400 truncate">{r.role}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(r.id)}
                disabled={deletingId === r.id}
                className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-40"
                aria-label="Remover responsável"
              >
                {deletingId === r.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Formulário de adição */}
      <form onSubmit={handleAdd} className="space-y-3 pt-4 border-t border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Nome *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Ex: João Silva"
            />
          </div>
          <div>
            <label className="label">
              Cargo <span className="text-slate-400 font-normal">• opcional</span>
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input"
              placeholder="Ex: Vendedor, Caixa"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
          ) : (
            <><Plus className="w-4 h-4" /> Adicionar Responsável</>
          )}
        </button>
      </form>
    </div>
  );
}
