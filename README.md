# Smart Promo AI — Intelligence Commerciale & Recommandation d'Offres

Plateforme SaaS d'aide à la décision commerciale pour le **retail** (distributeurs, grossistes,
industriels, enseignes GMS, category managers). Elle analyse les ventes, la météo, les saisons, les
jours fériés et les ruptures de stock pour recommander automatiquement les meilleures actions
commerciales — un véritable **« Conseiller Commercial Intelligent »**.

> Pensé pour le marché **Maroc / Afrique** : calendrier marketing local (Ramadan, Aïd…), devise MAD,
> interface en français.

---

## ✨ Ce qui est implémenté dans cette base (MVP)

Le cœur intelligent du produit est **fonctionnel et testé**, exposé via une API et un tableau de bord :

| Domaine | Détail |
| --- | --- |
| 🧠 **Moteur de recommandation d'offres** | Fusionne 5 signaux — tendance des ventes, météo, calendrier marketing, saisonnalité, risque de rupture — pour produire des recommandations classées (promotion, tête de gondole, dégustation, réassort) avec **impact estimé**, **CA menacé** et **score de confiance**. |
| 📥 **Importation Excel / CSV** | Import des ventes, produits, magasins et stocks avec **validation automatique** (en-têtes FR/EN tolérants, contrôle ligne par ligne, modèles téléchargeables, aperçu). Persistance multi-tenant via Prisma. |
| 🔗 **Pipeline branché sur les données** | Dès qu'un tenant a des données (import/seed), le tableau de bord, les recommandations, les prévisions et les listes lisent **PostgreSQL** (par société) ; sinon repli automatique sur le jeu de démo. Catégorie déduite du libellé à l'import pour activer l'intelligence météo/calendrier. |
| 📊 **Tableau de bord IA** | CA jour / 7 j / 30 j, évolution vs N-1, produits en croissance/baisse, magasins performants/en difficulté, **alertes automatiques**. |
| 🌤️ **Analyse météo** | Connecteur OpenWeatherMap (avec simulation déterministe sans clé) → tags commerciaux (canicule, pluie, froid). |
| 📅 **Calendrier marketing** | Détection automatique Ramadan, Aïd Al Fitr, Aïd Al Adha, rentrée, été, hiver, fêtes — avec affinités produits. |
| 📦 **Détection des ruptures** | Couverture de stock estimée + suggestions (commande fournisseur, transfert inter-magasin). |
| 📈 **Prévisions de ventes** | Tendance linéaire + saisonnalité hebdomadaire, horizons 7 / 30 / 90 / 365 jours. |
| 💬 **Assistant conversationnel** | Réponses **ancrées sur les données calculées** (pas d'hallucination) ; reformulation OpenAI optionnelle. |
| 🔐 **Multi-tenant & rôles** | Schéma Prisma multi-société (isolation par `tenantId`), JWT, 7 rôles, RBAC. |
| 🖥️ **Frontend premium** | Next.js + Tailwind : landing, connexion, dashboard, promotions IA, prévisions, produits, magasins, assistant. |

### 🗺️ Feuille de route (pages présentes en placeholder / à étoffer)
Connecteurs ERP (Sage / Odoo / SAP), génération de rapports PDF/Excel/PPTX, facturation,
gestion fine des utilisateurs, classement des enseignes, files d'attente BullMQ/Redis.

---

## 🏗️ Architecture

```
smart-promo-ai/
├── backend/                 # API Node.js + Express + TypeScript
│   ├── prisma/              # Schéma multi-tenant + seed démo
│   └── src/
│       ├── services/ai/     # 🧠 calendar · weather · forecast · recommendationEngine · assistant
│       ├── services/analytics/  # KPIs du tableau de bord
│       ├── services/        # intelligence (agrégateur) · authService · sampleData
│       ├── routes/          # auth · intelligence
│       ├── middleware/      # JWT + RBAC + erreurs
│       └── demo.ts          # ▶ pipeline complet SANS base de données
└── frontend/                # Next.js 14 (App Router) + Tailwind + Recharts
```

**Stack :** Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis (roadmap), JWT, Bcrypt ·
Next.js, React, Tailwind, Recharts, Lucide · OpenAI (optionnel) · Docker.

---

## 🚀 Démarrage rapide

### Option A — Démo instantanée (aucune base de données)

Le moteur tourne sur un jeu de données synthétique réaliste :

```bash
cd backend
npm install
npm run demo        # affiche dashboard + recommandations + prévisions dans le terminal
```

Puis l'API + le frontend en **mode démo** (login : `admin@smartpromo.ma` / `demo1234`) :

```bash
# Terminal 1 — API (mode démo si DATABASE_URL absent)
cd backend && npm run dev          # http://localhost:4000

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev   # http://localhost:3000
```

### Option B — Avec PostgreSQL (mode complet multi-tenant)

```bash
cp .env.example .env                # renseigner DATABASE_URL, JWT_SECRET, (OPENAI_API_KEY…)
docker compose up -d                # PostgreSQL + Redis

cd backend
npm install
npm run prisma:generate
npm run db:push                     # crée le schéma
npm run prisma:seed                 # tenant démo + 90 jours de ventes
npm run dev
```

---

## 🔌 Aperçu de l'API

| Méthode | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Connexion (JWT) |
| `POST` | `/api/auth/register` | Création société + admin |
| `GET` | `/api/dashboard` | KPIs, mouvements, magasins, alertes |
| `GET` | `/api/recommendations` | Offres recommandées par l'IA |
| `GET` | `/api/context` | Météo + calendrier marketing |
| `GET` | `/api/forecast/:sku` | Prévisions 7/30/90/365 j |
| `POST` | `/api/assistant` | Assistant conversationnel |
| `GET` | `/api/products` · `/api/stores` | Référentiels |
| `GET` | `/api/import/:entity/template` | Modèle CSV (sales/products/stores/stock) |
| `POST` | `/api/import/:entity` | Import Excel/CSV + validation (`?dryRun=1` = valider seulement) |

Toutes les routes `/api/*` (hors auth) exigent un header `Authorization: Bearer <token>`.

---

## 🧪 Qualité

```bash
cd backend && npm test       # tests unitaires du moteur (Vitest)
npm run build                # typecheck strict TypeScript
cd ../frontend && npm run build
```

CI GitHub Actions : `.github/workflows/ci.yml` (typecheck + tests backend + build frontend).

---

## 📄 Licence

MIT.
