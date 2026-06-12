"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { clearToken, getToken } from "@/lib/api";
import {
  BadgePercent,
  Bot,
  Building2,
  CreditCard,
  FileText,
  Gauge,
  LineChart,
  LogOut,
  Package,
  Settings,
  Store,
  Upload,
  Users,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord", icon: Gauge },
  { href: "/promotions", label: "Promotions IA", icon: BadgePercent },
  { href: "/forecasts", label: "Prévisions", icon: LineChart },
  { href: "/products", label: "Catalogue produits", icon: Package },
  { href: "/stores", label: "Clients & Tournées", icon: Store },
  { href: "/import", label: "Importation", icon: Upload },
  { href: "/reports", label: "Rapports", icon: FileText },
  { href: "/assistant", label: "Assistant IA", icon: Bot },
];

const NAV_SECONDARY = [
  { href: "/banners", label: "Types de clients", icon: Building2 },
  { href: "/users", label: "Utilisateurs", icon: Users },
  { href: "/billing", label: "Facturation", icon: CreditCard },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace("/login");
    else setReady(true);
  }, [router]);

  if (!ready) return <div className="grid min-h-screen place-items-center text-slate-400">Chargement…</div>;

  function logout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-4 lg:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2 text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">SP</span>
          Smart Promo <span className="text-brand-600">AI</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} active={pathname === item.href} />
          ))}
          <div className="my-3 border-t border-slate-100" />
          {NAV_SECONDARY.map((item) => (
            <NavLink key={item.href} {...item} active={pathname === item.href} />
          ))}
        </nav>

        <button onClick={logout} className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </aside>

      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Gauge; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
