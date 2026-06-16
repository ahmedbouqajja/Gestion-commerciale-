"use client";

import { useEffect, useState } from "react";
import { api, type ForecastResponse, type ProductRow } from "@/lib/api";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ForecastsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [sku, setSku] = useState<string>("");
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);

  useEffect(() => {
    api.products().then((r) => {
      setProducts(r.products);
      if (r.products[0]) setSku(r.products[0].sku);
    });
  }, []);

  useEffect(() => {
    if (sku) api.forecast(sku).then(setForecast);
  }, [sku]);

  const chartData = forecast?.d30.daily.map((p) => ({ jour: `J+${p.dayOffset}`, ventes: Math.round(p.value) })) ?? [];

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Prévisions de ventes</h1>
          <p className="text-sm text-slate-500">Projection de la demande à 7, 30, 90 et 365 jours.</p>
        </div>
        <select
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand-500"
        >
          {products.map((p) => (
            <option key={p.sku} value={p.sku}>{p.name}</option>
          ))}
        </select>
      </header>

      {forecast && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {([
              ["7 jours", forecast.d7],
              ["30 jours", forecast.d30],
              ["90 jours", forecast.d90],
              ["365 jours", forecast.d365],
            ] as const).map(([label, f]) => (
              <div key={label} className="card">
                <p className="text-sm text-slate-500">Demande estimée — {label}</p>
                <p className="mt-2 text-2xl font-bold">{new Intl.NumberFormat("fr-MA").format(Math.round(f.total))} u</p>
                <p className="mt-1 text-sm text-slate-500">
                  ~{f.dailyAverage}/j · tendance {f.trendPerDay >= 0 ? "+" : ""}{f.trendPerDay}/j · conf. {(f.confidence * 100).toFixed(0)}%
                </p>
              </div>
            ))}
          </div>

          <div className="card mt-6">
            <h2 className="font-semibold">Courbe de prévision — 30 jours</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="jour" tick={{ fontSize: 11 }} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="ventes" stroke="#4f46e5" fill="url(#g)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
