"use client";

import { useEffect, useState } from "react";
import { api, type BillingInfo } from "@/lib/api";
import { Building2, CheckCircle2, CloudSun, Globe, KeyRound, Loader2, Plug, SlidersHorizontal, X } from "lucide-react";

const COUNTRY_LABELS: Record<string, string> = {
  MA: "Maroc",
  FR: "France",
  TN: "Tunisie",
  DZ: "Algérie",
  SN: "Sénégal",
  CI: "Côte d'Ivoire",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-MA");
}

export default function SettingsPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    api.billing().then(setBilling).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-sm text-slate-500">Configuration de la société, préférences et intégrations.</p>
      </header>

      {error && <p className="text-red-600">{error}</p>}
      {!error && !billing && <p className="text-slate-400">Chargement…</p>}

      {billing && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Société */}
          <Section icon={Building2} title="Société">
            <Field label="Nom de la société" value={billing.tenantName} />
            <Field label="Pays" value={COUNTRY_LABELS[billing.country] ?? billing.country} />
            <Field label="Devise" value={billing.currency} />
            <Field label="Plan" value={billing.plan} />
            <Field label="Client depuis" value={formatDate(billing.since)} />
          </Section>

          {/* Préférences */}
          <Section icon={SlidersHorizontal} title="Préférences">
            <Field label="Langue de l'interface" value="Français" />
            <Field label="Devise d'affichage" value={billing.currency} />
            <Field label="Région" value={COUNTRY_LABELS[billing.country] ?? billing.country} />
            <Field label="Format de date" value="JJ/MM/AAAA" />
            <p className="mt-2 text-xs text-slate-400">
              La personnalisation des préférences sera modifiable prochainement.
            </p>
          </Section>

          {/* Météo & calendrier */}
          <Section icon={CloudSun} title="Intelligence météo & calendrier">
            <Field label="Source météo" value="OpenWeatherMap (simulation si aucune clé)" />
            <Field label="Calendrier marketing" value="Ramadan, Aïd, été, hiver — Maroc" />
            <p className="mt-2 text-xs text-slate-400">
              Ajoutez une clé <code>OPENWEATHER_API_KEY</code> côté serveur pour des prévisions réelles.
            </p>
          </Section>

          {/* Intégrations */}
          <Section icon={Plug} title="Intégrations ERP">
            <IntegrationRow name="Sage" status="Bientôt" />
            <IntegrationRow name="Odoo" status="Bientôt" />
            <IntegrationRow name="SAP" status="Bientôt" />
            <p className="mt-2 text-xs text-slate-400">
              En attendant, importez vos données via Excel / CSV depuis la page Importation.
            </p>
          </Section>

          {/* Sécurité */}
          <Section icon={KeyRound} title="Sécurité du compte">
            <p className="text-sm text-slate-600">
              Gérez l'accès via la page Utilisateurs et modifiez votre mot de passe ci-dessous.
            </p>
            <button onClick={() => setShowPw(true)} className="btn-primary mt-3 w-fit">
              Changer le mot de passe
            </button>
          </Section>

          {/* Données */}
          <Section icon={Globe} title="Données & confidentialité">
            <p className="text-sm text-slate-600">
              Vos données sont isolées par société (multi-tenant). Elles ne sont jamais partagées entre clients.
            </p>
          </Section>
        </div>
      )}

      {showPw && <ChangePasswordModal onClose={() => setShowPw(false)} />}
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Changement impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Changer le mot de passe</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="font-medium">Mot de passe modifié avec succès.</p>
            <button onClick={onClose} className="btn-primary mt-2">Fermer</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <PwInput label="Mot de passe actuel" value={currentPassword} onChange={setCurrentPassword} />
            <PwInput label="Nouveau mot de passe" value={newPassword} onChange={setNewPassword} hint="8 caractères minimum" />
            <PwInput label="Confirmer le nouveau mot de passe" value={confirm} onChange={setConfirm} />
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function PwInput({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Building2; title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        <Icon className="h-5 w-5 text-brand-600" /> {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

function IntegrationRow({ name, status }: { name: string; status: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-slate-700">{name}</span>
      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">{status}</span>
    </div>
  );
}
