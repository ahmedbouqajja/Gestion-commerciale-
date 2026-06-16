"use client";

import { useEffect, useState } from "react";
import { api, type BillingInfo } from "@/lib/api";
import { Check, Sparkles } from "lucide-react";

interface Plan {
  key: string;
  name: string;
  price: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    key: "STARTER",
    name: "Starter",
    price: "490 MAD/mois",
    tagline: "Pour démarrer la distribution.",
    features: [
      "Jusqu'à 30 clients",
      "Tableau de bord & alertes",
      "Recommandations d'offres IA",
      "Importation Excel / CSV",
      "1 utilisateur",
    ],
  },
  {
    key: "PRO",
    name: "Pro",
    price: "1 490 MAD/mois",
    tagline: "Pour piloter ventes, DLC et tournées.",
    highlight: true,
    features: [
      "Clients illimités",
      "Gestion des DLC & invendus",
      "Prévisions par client",
      "Rapports PDF / Excel",
      "Assistant IA",
      "Jusqu'à 10 utilisateurs",
    ],
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    price: "Sur devis",
    tagline: "Pour les réseaux multi-dépôts.",
    features: [
      "Tout le plan Pro",
      "Multi-sociétés & multi-dépôts",
      "Connecteurs ERP (Sage / Odoo / SAP)",
      "Utilisateurs illimités",
      "Support prioritaire dédié",
    ],
  },
];

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-MA");
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.billing().then(setBilling).catch((e) => setError(e.message));
  }, []);

  const currentPlan = PLANS.find((p) => p.key === billing?.plan);

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Facturation</h1>
        <p className="text-sm text-slate-500">Votre abonnement et les plans disponibles.</p>
      </header>

      {error && <p className="text-red-600">{error}</p>}
      {!error && !billing && <p className="text-slate-400">Chargement…</p>}

      {billing && (
        <>
          {/* Current subscription summary */}
          <div className="card mb-8 flex flex-wrap items-center justify-between gap-4 border-brand-200 bg-brand-50/40">
            <div>
              <p className="text-sm text-slate-500">Abonnement actuel</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-bold">
                <Sparkles className="h-5 w-5 text-brand-600" />
                Plan {currentPlan?.name ?? billing.plan}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {billing.tenantName} · {billing.currency} · Client depuis {formatDate(billing.since)}
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">Actif</span>
          </div>

          {/* Plan tiers */}
          <div className="grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = plan.key === billing.plan;
              return (
                <div
                  key={plan.key}
                  className={`card flex flex-col ${plan.highlight ? "ring-2 ring-brand-500" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{plan.name}</h2>
                    {isCurrent && (
                      <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">Plan actuel</span>
                    )}
                  </div>
                  <p className="mt-2 text-2xl font-bold">{plan.price}</p>
                  <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>

                  <ul className="mt-4 flex-1 space-y-2 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="text-slate-600">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled={isCurrent}
                    className={`mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      isCurrent
                        ? "cursor-default bg-slate-100 text-slate-400"
                        : "bg-brand-600 text-white hover:bg-brand-700"
                    }`}
                  >
                    {isCurrent ? "Votre plan" : plan.key === "ENTERPRISE" ? "Nous contacter" : "Changer de plan"}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Le paiement en ligne et l'historique des factures seront disponibles prochainement. Pour modifier votre
            abonnement, contactez votre conseiller Smart Promo AI.
          </p>
        </>
      )}
    </div>
  );
}
