"use client";

import { useRef, useState } from "react";
import { api, type ImportEntity, type ImportReport } from "@/lib/api";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";

const ENTITIES: { key: ImportEntity; label: string; hint: string }[] = [
  { key: "sales", label: "Ventes", hint: "sku, code magasin, date, quantité, CA" },
  { key: "products", label: "Produits", hint: "sku, nom, catégorie, prix" },
  { key: "stores", label: "Magasins", hint: "code, nom, enseigne, ville" },
  { key: "stock", label: "Stocks", hint: "sku, code magasin, quantité, seuil" },
];

export default function ImportPage() {
  const [entity, setEntity] = useState<ImportEntity>("sales");
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"validate" | "import" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function run(dryRun: boolean) {
    if (!file) return;
    setLoading(dryRun ? "validate" : "import");
    setError(null);
    setReport(null);
    try {
      setReport(await api.importFile(entity, file, dryRun));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import impossible.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Importation des données</h1>
        <p className="text-sm text-slate-500">Importez vos ventes, produits, magasins et stocks (Excel .xlsx ou CSV) avec validation automatique.</p>
      </header>

      {/* Entity selector */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ENTITIES.map((e) => (
          <button
            key={e.key}
            onClick={() => {
              setEntity(e.key);
              setReport(null);
            }}
            className={`card text-left transition ${entity === e.key ? "ring-2 ring-brand-500" : "hover:shadow-md"}`}
          >
            <FileSpreadsheet className={`h-6 w-6 ${entity === e.key ? "text-brand-600" : "text-slate-400"}`} />
            <p className="mt-2 font-semibold">{e.label}</p>
            <p className="mt-1 text-xs text-slate-500">{e.hint}</p>
          </button>
        ))}
      </div>

      {/* Upload zone */}
      <div className="card mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Fichier à importer — {ENTITIES.find((e) => e.key === entity)?.label}</h2>
          <button onClick={() => api.downloadTemplate(entity)} className="btn-ghost text-sm">
            <Download className="h-4 w-4" /> Télécharger le modèle CSV
          </button>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 py-10 text-center hover:border-brand-400"
        >
          <Upload className="h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-medium">{file ? file.name : "Cliquez pour choisir un fichier .xlsx ou .csv"}</p>
          <p className="text-xs text-slate-400">Taille max : 5 Mo</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setReport(null);
            }}
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={() => run(true)} disabled={!file || loading !== null} className="btn-ghost">
            {loading === "validate" && <Loader2 className="h-4 w-4 animate-spin" />} Valider (sans enregistrer)
          </button>
          <button onClick={() => run(false)} disabled={!file || loading !== null} className="btn-primary">
            {loading === "import" && <Loader2 className="h-4 w-4 animate-spin" />} Importer
          </button>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {report && <Report report={report} />}
    </div>
  );
}

function Report({ report }: { report: ImportReport }) {
  const ok = report.invalidRows === 0;
  return (
    <div className="card mt-6">
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
        <h2 className="font-semibold">Rapport de validation</h2>
        <span
          className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${
            report.mode === "PERSISTED" ? "bg-emerald-50 text-emerald-700" : report.mode === "DEMO" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {report.mode === "PERSISTED" ? `${report.persisted} ligne(s) enregistrée(s)` : report.mode === "DEMO" ? "Mode démo — validé sans enregistrement (DB requise)" : "Validation (sans enregistrement)"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Stat label="Lignes" value={report.totalRows} />
        <Stat label="Valides" value={report.validRows} tone="ok" />
        <Stat label="En erreur" value={report.invalidRows} tone={report.invalidRows ? "err" : undefined} />
      </div>

      {report.errors.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-700">Erreurs détectées</h3>
          <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Ligne</th>
                  <th className="px-3 py-2 font-medium">Champ</th>
                  <th className="px-3 py-2 font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.errors.map((e, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{e.row}</td>
                    <td className="px-3 py-2 text-slate-500">{e.field ?? "—"}</td>
                    <td className="px-3 py-2 text-red-600">{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {report.preview.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-700">Aperçu des lignes valides</h3>
          <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  {Object.keys(report.preview[0]).map((k) => (
                    <th key={k} className="px-3 py-2 font-medium">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.preview.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-3 py-2">{formatCell(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "ok" | "err" }) {
  const color = tone === "ok" ? "text-emerald-600" : tone === "err" ? "text-red-600" : "text-slate-900";
  return (
    <div className="rounded-xl bg-slate-50 py-3">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "oui" : "non";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
  return String(v);
}
