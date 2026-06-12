import Link from "next/link";
import { BarChart3, Brain, CalendarClock, CloudSun, Gauge, LineChart, PackageX, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";

const FEATURES = [
  { icon: Gauge, title: "Tableau de bord IA", desc: "CA jour/semaine/mois, évolution vs N-1, taux de retour et clients suivis en temps réel avec alertes automatiques." },
  { icon: CalendarClock, title: "Gestion des DLC", desc: "Détection des lots à date courte et recommandation automatique de déstockage ou transfert pour éviter la perte." },
  { icon: RotateCcw, title: "Réduction des invendus", desc: "Suivi du taux de retour et ajustement des quantités livrées par client pour protéger votre marge." },
  { icon: CloudSun, title: "Météo & calendrier", desc: "Canicule, Ramadan, Aïd, été… les pics de demande sur le frais et les laitages anticipés avant qu'ils n'arrivent." },
  { icon: LineChart, title: "Prévisions par client", desc: "Projections de demande à 7, 30, 90 et 365 jours pour planifier vos tournées et vos commandes." },
  { icon: PackageX, title: "Détection des ruptures", desc: "Risque de rupture détecté tôt, avec suggestions de commande fournisseur ou de transfert inter-clients." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">SP</span>
          Smart Promo <span className="text-brand-600">AI</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">Connexion</Link>
          <Link href="/login" className="btn-primary">Démarrer</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
          <Sparkles className="h-4 w-4" /> Conseiller intelligent pour distributeurs de produits laitiers
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Vendez plus, jetez moins : l'IA au service de votre distribution laitière
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Smart Promo AI analyse vos ventes par client, les DLC, la météo et les saisons pour anticiper la demande,
          prévenir les ruptures et réduire les invendus — pensé pour les distributeurs de lait et produits laitiers au Maroc et en Afrique.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/login" className="btn-primary px-6 py-3 text-base">Essayer la démo</Link>
          <Link href="#features" className="btn-ghost px-6 py-3 text-base">Découvrir</Link>
        </div>
        <p className="mt-4 text-sm text-slate-500">Démo : admin@smartpromo.ma / demo1234</p>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card transition hover:shadow-md">
              <f.icon className="h-8 w-8 text-brand-600" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust band */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-12 sm:grid-cols-3">
          {[
            { icon: BarChart3, stat: "+18%", label: "de ventes sur les offres recommandées" },
            { icon: RotateCcw, stat: "-30%", label: "d'invendus grâce au pilotage des DLC" },
            { icon: ShieldCheck, stat: "100%", label: "isolation des données multi-sociétés" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <s.icon className="h-10 w-10 text-brand-600" />
              <div>
                <div className="text-2xl font-bold">{s.stat}</div>
                <div className="text-sm text-slate-600">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-500">
        © {new Date().getFullYear()} Smart Promo AI — Intelligence commerciale pour la distribution laitière.
      </footer>
    </main>
  );
}
