"use client";

import { useEffect, useState } from "react";
import { api, type StoreRow } from "@/lib/api";
import { Building2, Store } from "lucide-react";

export default function ClientTypesPage() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.stores().then((r) => setStores(r.stores)).catch((e) => setError(e.message));
  }, []);

  // Group clients by point-of-sale type (banner).
  const byType = stores.reduce<Record<string, StoreRow[]>>((acc, s) => {
    const key = s.banner || "Autre";
    (acc[key] ??= []).push(s);
    return acc;
  }, {});
  const types = Object.entries(byType).sort((a, b) => b[1].length - a[1].length);
  const total = stores.length;

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Types de clients</h1>
        <p className="text-sm text-slate-500">Répartition de vos points de vente par type de commerce.</p>
      </header>

      {error && <p className="text-red-600">{error}</p>}
      {!error && total === 0 && <p className="text-slate-400">Chargement…</p>}

      {/* Summary cards per type */}
      {total > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {types.map(([type, list]) => {
              const share = Math.round((list.length / total) * 100);
              return (
                <div key={type} className="card">
                  <div className="flex items-center gap-2 text-brand-600">
                    <Building2 className="h-5 w-5" />
                    <span className="text-sm font-medium text-slate-700">{type}</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold">{list.length}</p>
                  <p className="text-xs text-slate-500">{share}% des clients</p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${share}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Per-type client lists */}
          <div className="mt-8 space-y-6">
            {types.map(([type, list]) => (
              <section key={type} className="card">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Store className="h-5 w-5 text-brand-600" /> {type}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{list.length}</span>
                </h2>
                <ul className="mt-3 divide-y divide-slate-100">
                  {list.map((s) => (
                    <li key={s.code} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-slate-500">{s.city}{s.region ? ` · ${s.region}` : ""}</span>
                      {s.route && <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-700">Tournée {s.route}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
