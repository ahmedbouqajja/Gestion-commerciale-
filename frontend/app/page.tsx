import Link from "next/link";
import { BarChart3, Brain, CloudSun, Gauge, LineChart, PackageX, ShieldCheck, Sparkles } from "lucide-react";

const FEATURES = [
  { icon: Gauge, title: "Tableau de bord IA", desc: "CA jour/semaine/mois, évolution vs N-1, produits et magasins suivis en temps réel avec alertes automatiques." },
  { icon: Sparkles, title: "Générateur d'offres", desc: "Le moteur recommande la promotion, la mise en avant et le réassort optimaux avec un impact estimé." },
  { icon: CloudSun, title: "Analyse météo & calendrier", desc: "Canicule, pluie, Ramadan, Aïd, rentrée… les pics de demande anticipés avant qu'ils n'arrivent." },
  { icon: LineChart, title: "Prévisions de ventes", desc: "Projections de demande à 7, 30, 90 et 365 jours pour piloter stock et chiffre d'affaires." },
  { icon: PackageX, title: "Détection des ruptures", desc: "Risque de rupture détecté tôt, avec suggestions de commande, transfert ou produit de substitution." },
  { icon: Brain, title: "Assistant conversationnel", desc: "« Quel produit promouvoir la semaine prochaine ? » — des réponses chiffrées et un plan d'action." },
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
          <Sparkles className="h-4 w-4" /> Conseiller commercial intelligent pour le retail
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Augmentez votre chiffre d'affaires et réduisez vos ruptures grâce à l'IA
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Smart Promo AI analyse vos ventes, la météo, les saisons et les ruptures de stock pour recommander
          automatiquement les meilleures actions commerciales — pensé pour les distributeurs, grossistes et enseignes GMS au Maroc et en Afrique.
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
            { icon: PackageX, stat: "-35%", label: "de ruptures grâce à la détection précoce" },
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
        © {new Date().getFullYear()} Smart Promo AI — Intelligence commerciale & recommandation d'offres.
      </footer>
    </main>
  );
}
