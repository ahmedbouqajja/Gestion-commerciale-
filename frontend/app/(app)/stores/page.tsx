"use client";

import { useEffect, useState } from "react";
import { api, type StoreRow } from "@/lib/api";
import { MapPin, Route, Truck, UserRound } from "lucide-react";

export default function StoresPage() {
  const [stores, setStores] = useState<StoreRow[]>([]);

  useEffect(() => {
    api.stores().then((r) => setStores(r.stores));
  }, []);

  // Group clients by delivery route (tournée).
  const byRoute = stores.reduce<Record<string, StoreRow[]>>((acc, s) => {
    const key = s.route || "Sans tournée";
    (acc[key] ??= []).push(s);
    return acc;
  }, {});
  const routes = Object.keys(byRoute).sort();

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Clients & Tournées</h1>
        <p className="text-sm text-slate-500">Points de vente livrés, regroupés par tournée de livraison.</p>
      </header>

      {stores.length === 0 && <p className="text-slate-400">Chargement des clients…</p>}

      <div className="space-y-8">
        {routes.map((route) => (
          <section key={route}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <Route className="h-4 w-4 text-brand-600" /> Tournée {route}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{byRoute[route].length}</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {byRoute[route].map((s) => (
                <div key={s.code} className="card">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{s.name}</h3>
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{s.banner}</span>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" /> {s.city} · {s.region}
                  </p>
                  {s.salesRep && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <UserRound className="h-4 w-4" /> {s.salesRep}
                    </p>
                  )}
                  {s.deliveryDays && s.deliveryDays.length > 0 && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <Truck className="h-4 w-4" /> {s.deliveryDays.join(" · ")}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">Code : {s.code}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
