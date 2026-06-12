"use client";

import { useEffect, useState } from "react";
import { api, type Recommendation } from "@/lib/api";
import { AlertTriangle, Sparkles, TrendingUp } from "lucide-react";

const DRIVER_LABELS: Record<string, string> = {
  WEATHER: "Météo",
  CALENDAR: "Calendrier",
  SEASON: "Saison",
  STOCKOUT: "Rupture",
  TREND: "Tendance",
};

export default function PromotionsPage() {
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.recommendations().then((r) => setRecs(r.recommendations)).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Promotions IA</h1>
        <p className="text-sm text-slate-500">Recommandations d'offres générées automatiquement, classées par impact business.</p>
      </header>

      {error && <p className="text-red-600">{error}</p>}
      {!recs && !error && <p className="text-slate-400">Analyse en cours…</p>}

      <div className="grid gap-4">
        {recs?.map((r) => {
          const isRisk = r.drivers.includes("STOCKOUT");
          return (
            <div key={r.sku} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 grid h-9 w-9 place-items-center rounded-xl ${isRisk ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600"}`}>
                    {isRisk ? <AlertTriangle className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  </span>
                  <div>
                    <h3 className="font-semibold">{r.title}</h3>
                    <p className="mt-1 max-w-2xl text-sm text-slate-600">{r.rationale}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-lg font-bold text-emerald-600">
                    <TrendingUp className="h-4 w-4" /> +{r.estimatedUplift}%
                  </div>
                  <div className="text-xs text-slate-400">confiance {(r.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {r.actions.map((a, i) => (
                  <span key={i} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                    {a.label}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.drivers.map((d) => (
                  <span key={d} className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500">
                    {DRIVER_LABELS[d] ?? d}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
