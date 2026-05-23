"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ArrowUpDown,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/movimentacoes", label: "Movimentações", icon: ArrowUpDown },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userOpen, setUserOpen] = useState(false);

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Boxes className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <span className="font-semibold text-slate-900 text-lg">EstoqueMax</span>
        </div>
        {session?.user?.company && (
          <p className="text-xs text-slate-400 mt-1 pl-10">{session.user.company}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn("w-4.5 h-4.5", active ? "text-primary-600" : "text-slate-400")}
                style={{ width: 18, height: 18 }}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-100 px-3 py-3">
        <button
          onClick={() => setUserOpen(!userOpen)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-primary-700 text-xs font-semibold">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{session?.user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", userOpen && "rotate-180")} />
        </button>
        {userOpen && (
          <div className="mt-1 px-2">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
