"use client";

import { useState } from "react";
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
  Menu,
  X,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

const nav = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/movimentacoes", label: "Movimentações", icon: ArrowUpDown },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <Boxes className="text-white" style={{ width: 16, height: 16 }} />
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">EstoqueMax</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" />
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 pt-14">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-72 h-full shadow-xl flex flex-col">
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {nav.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                      active
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    <Icon
                      className={cn("shrink-0", active ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500")}
                      style={{ width: 18, height: 18 }}
                    />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-100 dark:border-slate-800 p-4">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{session?.user?.name}</p>
              <p className="text-xs text-slate-400">{session?.user?.email}</p>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 mt-3 text-sm text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav for mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-30">
        <div className="grid grid-cols-5 py-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-xs",
                  active ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500"
                )}
              >
                <Icon style={{ width: 20, height: 20 }} />
                <span className="text-[10px]">{label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
