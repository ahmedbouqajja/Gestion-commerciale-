"use client";

import { useEffect, useState } from "react";
import { api, type StoreRow } from "@/lib/api";
import { MapPin } from "lucide-react";

export default function StoresPage() {
  const [stores, setStores] = useState<StoreRow[]>([]);

  useEffect(() => {
    api.stores().then((r) => setStores(r.stores));
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Analyse Magasins</h1>
        <p className="text-sm text-slate-500">Réseau de points de vente et enseignes.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((s) => (
          <div key={s.code} className="card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{s.name}</h3>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{s.banner}</span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-4 w-4" /> {s.city} · {s.region}
            </p>
            <p className="mt-1 text-xs text-slate-400">Code : {s.code}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
