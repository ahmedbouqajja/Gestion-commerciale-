"use client";

import { useEffect, useState } from "react";
import { api, type ReportPeriod, type ReportPreview } from "@/lib/api";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: "weekly", label: "Hebdomadaire" },
  { key: "monthly", label: "Mensuel" },
  { key: "quarterly", label: "Trimestriel" },
];

function formatMAD(n: number) {
  return new Intl.NumberFormat("fr-MA").format(Math.round(n)) + " MAD";
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<"pdf" | "xlsx" | null>(null);

  useEffect(() => {
    setPreview(null);
    setError(null);
    api.reportPreview(period).then(setPreview).catch((e) => setError(e.message));
  }, [period]);

  async function download(format: "pdf" | "xlsx") {
    setDownloading(format);
    setError(null);
    try {
      await api.downloadReport(period, format);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Téléchargement impossible.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rapports</h1>
          <p className="text-sm text-slate-500">Générez des rapports premium (PDF / Excel) avec commentaires automatiques.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => download("pdf")} disabled={downloading !== null} className="btn-primary">
            {downloading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} PDF
          </button>
          <button onClick={() => download("xlsx")} disabled={downloading !== null} className="btn-ghost">
            {downloading === "xlsx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Excel
          </button>
        </div>
      </header>

      {/* Period tabs */}
      <div className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${period === p.key ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {!preview && !error && <p className="text-slate-400">Préparation de l'aperçu…</p>}

      {preview && (
        <div className="space-y-6">
          {/* Document preview card */}
          <div className="card mx-auto max-w-3xl">
            <div className="-m-5 mb-5 rounded-t-2xl bg-brand-600 px-6 py-5 text-white">
              <h2 className="text-xl font-bold">Smart Promo AI</h2>
              <p className="text-sm opacity-90">
                Rapport {PERIODS.find((p) => p.key === period)?.label} — {preview.tenantName}
              </p>
            </div>

            <h3 className="text-sm font-semibold text-brand-700">Indicateurs clés</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {preview.kpis.map((k) => (
                <div key={k.label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{k.label}</p>
                  <p className="text-lg font-bold">{formatMAD(k.value)}</p>
                  {k.changePct !== undefined && (
                    <p className={`text-xs font-medium ${k.changePct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {k.changePct >= 0 ? "+" : ""}{k.changePct}% vs N-1
                    </p>
                  )}
                </div>
              ))}
            </div>

            <h3 className="mt-6 text-sm font-semibold text-brand-700">Synthèse exécutive</h3>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
              {preview.commentary.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <p className="mt-6 text-xs text-slate-400">
              {preview.recommendationsCount} recommandation(s) incluse(s) · généré le {new Date(preview.generatedAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
