# Smart Promo AI — Intelligence Commerciale pour la Distribution Laitière

Plateforme SaaS d'aide à la décision pour les **distributeurs de lait et produits laitiers** qui
livrent les points de vente (supérettes, épiceries, cafés-laiteries, grandes surfaces). Elle analyse
les ventes par client, les **dates limites de consommation (DLC)**, la météo, les saisons et les
ruptures de stock pour anticiper la demande, prévenir les ruptures et **réduire les invendus** — un
véritable **« Conseiller Commercial Intelligent »**.

> Pensé pour le marché **Maroc / Afrique** : calendrier marketing local (Ramadan, Aïd…), devise MAD,
> interface en français. Les produits étant à **courte DLC**, la prévention de la perte est au cœur du moteur.

---

## ✨ Ce qui est implémenté dans cette base (MVP)

Le cœur intelligent du produit est **fonctionnel et testé**, exposé via une API et un tableau de bord :

| Domaine | Détail |
| --- | --- |
| 🧠 **Moteur de recommandation d'offres** | Fusionne 6 signaux — tendance des ventes, météo, calendrier marketing, saisonnalité, risque de rupture et **risque de péremption (DLC)** — pour produire des recommandations classées (promotion, déstockage, transfert, réassort) avec **impact estimé**, **CA menacé**, **perte évitée** et **score de confiance**. |
| 🥛 **Gestion des DLC** | Détection des lots à date courte sur-stockés : calcul des unités qui risquent de périmer et recommandation automatique de **déstockage** / **transfert vers un client à forte rotation**, avec **perte estimée en MAD**. |
| 🔄 **Suivi des retours / invendus** | KPI **taux de retour** et **valeur des retours** sur 30 j, avec alerte automatique au-delà d'un seuil pour ajuster les quantités livrées. |
| 📥 **Importation Excel / CSV** | Import des ventes, achats, produits et clients avec **validation automatique** (en-têtes FR/EN tolérants, contrôle ligne par ligne, modèles téléchargeables, aperçu). Persistance multi-tenant via Prisma. |
| 📦 **Stock dépôt automatique** | Le stock se calcule seul : **inventaire initial + achats (entrées) − ventes (sorties)**. Seuil de réapprovisionnement déduit du rythme de vente. |
| 🔗 **Pipeline branché sur les données** | Dès qu'un tenant a des données (import/seed), le tableau de bord, les recommandations, les prévisions et les listes lisent **PostgreSQL** (par société) ; sinon repli automatique sur le jeu de démo. Catégorie déduite du libellé à l'import pour activer l'intelligence météo/calendrier. |
| 📄 **Génération de rapports** | Rapports **PDF** (pdfkit) et **Excel** (exceljs) hebdo / mensuel / trimestriel, style corporate, avec **commentaires exécutifs auto-générés** (ancrés sur les données, enrichis par OpenAI si configuré) et aperçu dans l'app. |
| 📊 **Tableau de bord IA** | CA jour / 7 j / 30 j, évolution vs N-1, **taux de retour**, produits en croissance/baisse, clients performants/en difficulté, **alertes automatiques**. |
| 🚚 **Clients & tournées** | Points de vente livrés rattachés à un **commercial**, une **tournée** et des **jours de livraison** ; analyse de performance par client. |
| 🌤️ **Analyse météo** | Connecteur OpenWeatherMap (avec simulation déterministe sans clé) → tags commerciaux (canicule, pluie, froid). |
| 📅 **Calendrier marketing** | Détection automatique Ramadan, Aïd Al Fitr, Aïd Al Adha, rentrée, été, hiver, fêtes — avec affinités produits. |
| 📦 **Détection des ruptures** | Couverture de stock estimée + suggestions (commande fournisseur, transfert depuis un client excédentaire). |
| 📈 **Prévisions de ventes** | Tendance linéaire + saisonnalité hebdomadaire, horizons 7 / 30 / 90 / 365 jours. |
| 💬 **Assistant conversationnel** | Réponses **ancrées sur les données calculées** (pas d'hallucination) ; reformulation OpenAI optionnelle. |
| 🔐 **Multi-tenant & rôles** | Schéma Prisma multi-société (isolation par `tenantId`), JWT, 7 rôles, RBAC. |
| 🖥️ **Frontend premium** | Next.js + Tailwind : landing, connexion, dashboard, promotions IA, prévisions, produits, magasins, assistant. |

### 🗺️ Feuille de route (pages présentes en placeholder / à étoffer)
Connecteurs ERP (Sage / Odoo / SAP), export PowerPoint (PPTX), facturation,
gestion fine des utilisateurs, classement des enseignes, files d'attente BullMQ/Redis
(rapports planifiés / envoi automatique par email).

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
| `GET` | `/api/reports/preview?period=` | Aperçu rapport (KPIs + commentaires) |
| `GET` | `/api/reports/:period.:format` | Télécharger rapport (`weekly\|monthly\|quarterly`.`pdf\|xlsx`) |

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
