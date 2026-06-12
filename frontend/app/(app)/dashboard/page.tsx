"use client";

import { useEffect, useState } from "react";
import { api, type DashboardSummary, type EngineContext } from "@/lib/api";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  Cell,
} from "recharts";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CloudSun, CalendarDays, Info } from "lucide-react";

function formatMAD(n: number) {
  return new Intl.NumberFormat("fr-MA").format(Math.round(n)) + " MAD";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [ctx, setCtx] = useState<EngineContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.dashboard(), api.context()])
      .then(([d, c]) => {
        setData(d);
        setCtx(c);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Shell><p className="text-red-600">{error}</p></Shell>;
  if (!data || !ctx) return <Shell><p className="text-slate-400">Chargement du tableau de bord…</p></Shell>;

  const moversChart = [...data.topGrowers.slice(0, 4), ...data.topDecliners.slice(0, 3)].map((m) => ({
    name: m.name.split(" ").slice(0, 2).join(" "),
    changePct: m.changePct,
  }));

  return (
    <Shell>
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((k) => (
          <div key={k.label} className="card">
            <p className="text-sm text-slate-500">{k.label}</p>
            <p className="mt-2 text-2xl font-bold">{formatMAD(k.value)}</p>
            {k.changePct !== undefined && (
              <p className={`mt-1 inline-flex items-center gap-1 text-sm font-medium ${k.changePct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {k.changePct >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {k.changePct >= 0 ? "+" : ""}{k.changePct}% vs N-1
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="mt-6 space-y-2">
        {data.alerts.map((a, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              a.level === "CRITICAL"
                ? "border-red-200 bg-red-50 text-red-700"
                : a.level === "WARNING"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {a.level === "INFO" ? <Info className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {a.message}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Movers chart */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold">Évolution des produits (30 j vs période précédente)</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moversChart}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="changePct" radius={[6, 6, 0, 0]}>
                  {moversChart.map((m, i) => (
                    <Cell key={i} fill={m.changePct >= 0 ? "#10b981" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Context */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="flex items-center gap-2 font-semibold"><CloudSun className="h-5 w-5 text-brand-600" /> Météo (5 j)</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {ctx.weather.map((w) => (
                <li key={w.date} className="flex items-center justify-between">
                  <span className="text-slate-500">{w.date.slice(5)}</span>
                  <span className="font-medium">{w.tempC}°C</span>
                  <span className="text-xs text-slate-400">{w.tags.join(", ")}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h2 className="flex items-center gap-2 font-semibold"><CalendarDays className="h-5 w-5 text-brand-600" /> Calendrier marketing</h2>
            {ctx.events.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {ctx.events.map((e) => (
                  <li key={e.tag} className="flex items-center justify-between">
                    <span className="font-medium">{e.name}</span>
                    <span className="text-xs text-slate-400">{e.startsInDays === 0 ? "en cours" : `dans ${e.startsInDays} j`}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-400">Aucun événement à venir.</p>
            )}
          </div>
        </div>
      </div>

      {/* Stores */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <StoreList title="Magasins performants" rows={data.topStores} positive />
        <StoreList title="Magasins en difficulté" rows={data.strugglingStores} />
      </div>
    </Shell>
  );
}

function StoreList({ title, rows, positive }: { title: string; rows: DashboardSummary["topStores"]; positive?: boolean }) {
  return (
    <div className="card">
      <h2 className="font-semibold">{title}</h2>
      {rows.length ? (
        <ul className="mt-3 divide-y divide-slate-100">
          {rows.map((s) => (
            <li key={s.code} className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-medium">{s.name}</span>
              <span className="text-slate-500">{formatMAD(s.revenue)}</span>
              <span className={`font-medium ${s.changePct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {s.changePct >= 0 ? "+" : ""}{s.changePct}%
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-400">{positive ? "—" : "Aucun magasin en difficulté."}</p>
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Tableau de bord IA</h1>
        <p className="text-sm text-slate-500">Vue d'ensemble de votre activité commerciale et des alertes automatiques.</p>
      </header>
      {children}
    </div>
  );
}
