"use client";

import { useEffect, useState } from "react";
import { api, type ReorderRow } from "@/lib/api";
import { Download, PackageCheck, ShoppingCart } from "lucide-react";

function formatMAD(n: number) {
  return new Intl.NumberFormat("fr-MA").format(Math.round(n)) + " MAD";
}

const CATEGORY_LABELS: Record<string, string> = {
  DAIRY: "Laitiers",
  BEVERAGE: "Boissons",
  FROZEN: "Surgelés",
  GROCERY: "Épicerie",
  MEAT: "Viandes",
  FISH: "Poissons",
  FRESH: "Frais",
};

export default function ReordersPage() {
  const [reorders, setReorders] = useState<ReorderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.reorders().then((r) => setReorders(r.reorders)).catch((e) => setError(e.message));
  }, []);

  async function download() {
    setDownloading(true);
    try {
      await api.downloadReorders();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Téléchargement impossible.");
    } finally {
      setDownloading(false);
    }
  }

  const total = reorders?.reduce((s, r) => s + r.estimatedCost, 0) ?? 0;

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Réapprovisionnement</h1>
          <p className="text-sm text-slate-500">
            Commande fournisseur suggérée : produits dont la couverture est ≤ 7 jours, réapprovisionnés à ~14 jours.
          </p>
        </div>
        {reorders && reorders.length > 0 && (
          <button onClick={download} disabled={downloading} className="btn-primary">
            <Download className="h-4 w-4" /> Exporter la commande (Excel)
          </button>
        )}
      </header>

      {error && <p className="text-red-600">{error}</p>}
      {!error && !reorders && <p className="text-slate-400">Analyse du stock en cours…</p>}

      {reorders && reorders.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <PackageCheck className="h-10 w-10 text-emerald-500" />
          <p className="mt-3 font-medium">Aucun réapprovisionnement nécessaire</p>
          <p className="mt-1 text-sm text-slate-500">Tous les produits ont une couverture de stock suffisante.</p>
        </div>
      )}

      {reorders && reorders.length > 0 && (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <Kpi label="Produits à commander" value={String(reorders.length)} />
            <Kpi label="Unités totales" value={new Intl.NumberFormat("fr-MA").format(reorders.reduce((s, r) => s + r.suggestedQty, 0))} />
            <Kpi label="Coût estimé total" value={formatMAD(total)} accent />
          </div>

          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Produit</th>
                  <th className="px-4 py-3 font-medium">Catégorie</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Ventes/j</th>
                  <th className="px-4 py-3 font-medium">Couverture</th>
                  <th className="px-4 py-3 font-medium">Qté à commander</th>
                  <th className="px-4 py-3 font-medium">Coût estimé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reorders.map((r) => (
                  <tr key={r.sku} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-slate-500">{CATEGORY_LABELS[r.category] ?? r.category}</td>
                    <td className="px-4 py-3">{new Intl.NumberFormat("fr-MA").format(r.stock)}</td>
                    <td className="px-4 py-3 text-slate-500">{r.dailySales}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${r.daysOfCover <= 3 ? "text-red-600" : "text-amber-600"}`}>{r.daysOfCover} j</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{new Intl.NumberFormat("fr-MA").format(r.suggestedQty)}</td>
                    <td className="px-4 py-3">{formatMAD(r.estimatedCost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 font-semibold">
                  <td className="px-4 py-3" colSpan={6}>Total</td>
                  <td className="px-4 py-3">{formatMAD(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card">
      <p className="flex items-center gap-2 text-sm text-slate-500">
        <ShoppingCart className="h-4 w-4 text-brand-600" /> {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${accent ? "text-brand-700" : ""}`}>{value}</p>
    </div>
  );
}
