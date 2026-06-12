"use client";

import { useEffect, useState } from "react";
import { api, type StockReportRow } from "@/lib/api";
import { ArrowDownLeft, ArrowUpRight, Download, Boxes } from "lucide-react";

function formatMAD(n: number) {
  return new Intl.NumberFormat("fr-MA").format(Math.round(n)) + " MAD";
}
const nf = (n: number) => new Intl.NumberFormat("fr-MA").format(n);

const CATEGORY_LABELS: Record<string, string> = {
  DAIRY: "Laitiers",
  BEVERAGE: "Boissons",
  FROZEN: "Surgelés",
  GROCERY: "Épicerie",
  MEAT: "Viandes",
  FISH: "Poissons",
  FRESH: "Frais",
};

export default function StockPage() {
  const [rows, setRows] = useState<StockReportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.stockReport().then((r) => setRows(r.rows)).catch((e) => setError(e.message));
  }, []);

  async function download() {
    setDownloading(true);
    try {
      await api.downloadStockReport();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Téléchargement impossible.");
    } finally {
      setDownloading(false);
    }
  }

  const totalValue = rows?.reduce((s, r) => s + r.stockValue, 0) ?? 0;
  const totalUnits = rows?.reduce((s, r) => s + r.stock, 0) ?? 0;

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">État du stock</h1>
          <p className="text-sm text-slate-500">Stock dépôt, entrées/sorties sur 30 jours et valeur du stock.</p>
        </div>
        {rows && rows.length > 0 && (
          <button onClick={download} disabled={downloading} className="btn-primary">
            <Download className="h-4 w-4" /> Exporter (Excel)
          </button>
        )}
      </header>

      {error && <p className="text-red-600">{error}</p>}
      {!error && !rows && <p className="text-slate-400">Chargement…</p>}

      {rows && (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <Kpi label="Références" value={nf(rows.length)} />
            <Kpi label="Unités en stock" value={nf(totalUnits)} />
            <Kpi label="Valeur du stock" value={formatMAD(totalValue)} accent />
          </div>

          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Produit</th>
                  <th className="px-4 py-3 font-medium">Catégorie</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Entrées 30j</th>
                  <th className="px-4 py-3 font-medium">Sorties 30j</th>
                  <th className="px-4 py-3 font-medium">Valeur stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.sku} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-slate-500">{CATEGORY_LABELS[r.category] ?? r.category}</td>
                    <td className="px-4 py-3">{nf(r.stock)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <ArrowDownLeft className="h-3.5 w-3.5" /> {nf(r.entrees30)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <ArrowUpRight className="h-3.5 w-3.5" /> {nf(r.sorties30)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatMAD(r.stockValue)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 font-semibold">
                  <td className="px-4 py-3" colSpan={5}>Valeur totale du stock</td>
                  <td className="px-4 py-3">{formatMAD(totalValue)}</td>
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
        <Boxes className="h-4 w-4 text-brand-600" /> {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${accent ? "text-brand-700" : ""}`}>{value}</p>
    </div>
  );
}
