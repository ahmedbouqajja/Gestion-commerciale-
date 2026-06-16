import { Construction } from "lucide-react";

export function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-slate-500">{description}</p>
      </header>
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <Construction className="h-10 w-10 text-brand-600" />
        <p className="mt-3 font-medium">Module en cours de développement</p>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          Cette page fait partie de la feuille de route produit. L'architecture backend et le moteur IA
          sont déjà en place pour l'alimenter.
        </p>
      </div>
    </div>
  );
}
