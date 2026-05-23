"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User, Lock, Building2, CheckCircle2 } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  company: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual obrigatória"),
    newPassword: z.string().min(6, "Nova senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ConfiguracoesPage() {
  const { data: session, update } = useSession();
  const [profileStatus, setProfileStatus] = useState<"idle" | "success" | "error">("idle");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "success" | "error">("idle");
  const [passwordError, setPasswordError] = useState("");

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      company: session?.user?.company || "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  async function handleProfileSave(data: ProfileForm) {
    setProfileStatus("idle");
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      // Update the JWT session so sidebar reflects new name/company immediately
      await update();
      // Reset form with the saved values so user sees confirmation
      profileForm.reset({ name: data.name, company: data.company });
      setProfileStatus("success");
      setTimeout(() => setProfileStatus("idle"), 4000);
    } else {
      setProfileStatus("error");
    }
  }

  async function handlePasswordChange(data: PasswordForm) {
    setPasswordError("");
    setPasswordStatus("idle");
    const res = await fetch("/api/user/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      passwordForm.reset();
      setPasswordStatus("success");
      setTimeout(() => setPasswordStatus("idle"), 4000);
    } else {
      const err = await res.json();
      setPasswordError(err.error || "Erro ao alterar senha");
      setPasswordStatus("error");
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gerencie seu perfil e preferências</p>
      </div>

      {/* Profile */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <h2 className="font-medium text-slate-900">Dados do Perfil</h2>
        </div>

        <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              value={session?.user?.email || ""}
              disabled
              className="input bg-slate-50 text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">O email não pode ser alterado</p>
          </div>

          <div>
            <label className="label">Seu Nome *</label>
            <input {...profileForm.register("name")} className="input" placeholder="Seu nome completo" />
            {profileForm.formState.errors.name && (
              <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-sm font-medium text-slate-700">Nome do Estabelecimento</label>
            </div>
            <input
              {...profileForm.register("company")}
              className="input"
              placeholder="Ex: Mercado do João"
            />
          </div>

          {/* Feedback banner */}
          {profileStatus === "success" && (
            <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-800 font-medium">Perfil atualizado com sucesso!</p>
            </div>
          )}
          {profileStatus === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">Erro ao salvar perfil. Tente novamente.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={profileForm.formState.isSubmitting}
            className="btn-primary"
          >
            {profileForm.formState.isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            ) : (
              "Salvar Perfil"
            )}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Lock className="w-4 h-4 text-slate-600" />
          </div>
          <h2 className="font-medium text-slate-900">Alterar Senha</h2>
        </div>

        <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
          <div>
            <label className="label">Senha Atual *</label>
            <input {...passwordForm.register("currentPassword")} type="password" className="input" placeholder="••••••••" />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="label">Nova Senha *</label>
            <input {...passwordForm.register("newPassword")} type="password" className="input" placeholder="Mínimo 6 caracteres" />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="label">Confirmar Nova Senha *</label>
            <input {...passwordForm.register("confirmPassword")} type="password" className="input" placeholder="Repita a nova senha" />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          {passwordStatus === "success" && (
            <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-800 font-medium">Senha alterada com sucesso!</p>
            </div>
          )}
          {passwordError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">{passwordError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={passwordForm.formState.isSubmitting}
            className="btn-secondary"
          >
            {passwordForm.formState.isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Alterando...</>
            ) : (
              "Alterar Senha"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
