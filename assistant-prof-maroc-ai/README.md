# Assistant Prof Maroc AI — MVP

Plateforme SaaS qui permet aux **enseignants marocains** (primaire, collège, lycée) de préparer leurs documents pédagogiques en quelques minutes grâce à l'intelligence artificielle.

> Générez en moins de 5 minutes : une **Jdada** (الجذاذة) complète, un **contrôle**, un **examen**, des **exercices** et des **devoirs** — avec export **PDF** et **Word** prêts à imprimer.

---

## ✨ Fonctionnalités du MVP

| Outil | Description |
|-------|-------------|
| **Générateur de Jdada** (الجذاذات) | Objectifs, compétences, prérequis, déroulement, activités, évaluation, remédiation |
| **Générateur de Contrôles** | Sujet + corrigé + barème (sur 20) |
| **Générateur d'Examens** | Local / semestriel / blanc — version élève + corrigé officiel + barème |
| **Banque d'Exercices IA** | Exercices faciles / moyens / difficiles avec solutions |
| **Générateur de Devoirs Maison** | Travaux à domicile + révisions + corrigé |
| **Bibliothèque personnelle** | Modifier, dupliquer, télécharger (PDF/Word), supprimer |
| **Assistant IA pédagogique** | Chat de conseils, activités et méthodes d'enseignement |

- 🌍 **Bilingue** Français / Arabe (avec support RTL). Anglais prévu plus tard.
- 💳 **Abonnements** : Pack Gratuit (5 générations/mois) · Pack Prof (illimité, 29 DH/mois).
- 📄 **Export** PDF et Word prêts à imprimer.

---

## 🏗️ Architecture

```
Utilisateur
  → Frontend Next.js (React, TypeScript, Tailwind)
    → Backend Node.js / Express (TypeScript, Prisma)
      → AI Service (Prompt Engineering)
        → OpenAI API
      → Génération PDF / Word
```

Le frontend **n'appelle jamais OpenAI directement** : toutes les requêtes IA passent par le backend.
L'utilisateur final ne voit que l'identité **« Assistant Prof Maroc AI »** (aucune mention du fournisseur).

### Couche AI Service (`backend/src/services/ai/`)

```
ai/
├── index.ts              # Façade : generateDocument(), chat() — point d'entrée unique
├── openai.service.ts     # Unique point d'appel à OpenAI (+ fallback démo branded)
├── prompts/
│   ├── system.ts         # Identité plateforme (FR/AR)
│   └── builder.ts        # Prompt Engineering : adapte selon matière/niveau/type/langue
└── templates/
    └── index.ts          # Templates pédagogiques par type de document
```

**Évolutivité prévue** (phases suivantes, déjà câblée via `retrieveContext`) :
base documentaire marocaine (RAG), import de manuels scolaires, base de connaissances
propriétaire, modèle IA spécialisé — sans impacter les contrôleurs.

---

## 📁 Structure du dépôt

```
backend/    API Express + Prisma + PostgreSQL + AI Service + export PDF/Word
frontend/   Application Next.js (App Router) + Tailwind + UI bilingue FR/AR
```

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js ≥ 20
- PostgreSQL ≥ 14

### 1. Backend

```bash
cd backend
cp .env.example .env          # renseignez DATABASE_URL, JWT_SECRET, OPENAI_API_KEY
npm install
npx prisma migrate dev        # crée le schéma
npm run db:seed               # (optionnel) compte démo : prof@demo.ma / password123
npm run dev                   # http://localhost:4000
```

> Sans `OPENAI_API_KEY`, l'API fonctionne en **mode démonstration** (contenu factice
> branded « Assistant Prof Maroc AI ») afin de tester l'application de bout en bout.

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm install
npm run dev                   # http://localhost:3000
```

---

## 🔌 API principale

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/auth/register` · `/login` | Inscription / connexion (JWT) |
| `GET` | `/api/auth/me` | Profil + quota |
| `POST` | `/api/generate/{jdada,controle,examen,exercices,devoir}` | Génération IA |
| `POST` | `/api/chat` | Assistant pédagogique |
| `GET` | `/api/documents` | Bibliothèque (filtre `?type=`) |
| `GET` | `/api/documents/:id/export/:format` | Export `pdf` / `docx` |
| `POST` | `/api/auth/upgrade` | Activation Pack Prof (simulée — CMI/PayPal à venir) |

---

## 🛠️ Stack technique

**Frontend :** Next.js 14, React 18, TypeScript, Tailwind CSS, composants UI (style Shadcn), lucide-react.
**Backend :** Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, bcrypt, Zod.
**IA :** OpenAI API via une couche AI Service dédiée et un module de Prompt Engineering.
**Export :** PDFKit (PDF) et docx (Word).

---

## 🗺️ Feuille de route (post-MVP)
- Paiement réel CMI / Carte bancaire / PayPal
- RAG sur base documentaire marocaine + import des manuels scolaires
- Ajout de la langue anglaise
- Gestion des classes / partage de documents entre enseignants
