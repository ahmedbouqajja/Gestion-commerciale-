"use client";

import { useEffect, useState } from "react";
import { api, type UserRow } from "@/lib/api";
import { ShieldCheck, UserRound } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super administrateur",
  TENANT_ADMIN: "Administrateur",
  COMMERCIAL_DIRECTOR: "Directeur commercial",
  ZONE_MANAGER: "Chef de secteur",
  STORE_MANAGER: "Responsable client",
  ANALYST: "Analyste",
  VIEWER: "Lecture seule",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-MA");
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.users().then((r) => setUsers(r.users)).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <p className="text-sm text-slate-500">Membres de votre équipe, rôles et accès.</p>
      </header>

      {error && <p className="text-red-600">{error}</p>}
      {!error && users.length === 0 && <p className="text-slate-400">Chargement…</p>}

      {users.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Utilisateur</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="px-4 py-3 font-medium">Dernière connexion</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-brand-600">
                        <UserRound className="h-4 w-4" />
                      </span>
                      {u.fullName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      <ShieldCheck className="h-3.5 w-3.5" /> {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(u.lastLoginAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                      {u.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
