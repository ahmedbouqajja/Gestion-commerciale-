"use client";

import { useEffect, useState } from "react";
import { api, type ProductRow } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  DAIRY: "Laitiers",
  BEVERAGE: "Boissons",
  FROZEN: "Surgelés",
  GROCERY: "Épicerie",
  MEAT: "Viandes",
  FISH: "Poissons",
  FRESH: "Frais",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);

  useEffect(() => {
    api.products().then((r) => setProducts(r.products));
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Analyse Produits</h1>
        <p className="text-sm text-slate-500">Catalogue, stock et couverture estimée.</p>
      </header>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Produit</th>
              <th className="px-4 py-3 font-medium">Catégorie</th>
              <th className="px-4 py-3 font-medium">Prix</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Couverture</th>
              <th className="px-4 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => {
              const risk = p.daysOfCover !== null && p.daysOfCover <= 5;
              return (
                <tr key={p.sku} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{p.name}{p.seasonal && <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-600">saisonnier</span>}</td>
                  <td className="px-4 py-3 text-slate-500">{CATEGORY_LABELS[p.category] ?? p.category}</td>
                  <td className="px-4 py-3">{p.unitPrice} MAD</td>
                  <td className="px-4 py-3">{new Intl.NumberFormat("fr-MA").format(p.stock)}</td>
                  <td className="px-4 py-3">{p.daysOfCover !== null ? `${p.daysOfCover} j` : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${risk ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                      {risk ? "Risque rupture" : "Sain"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
