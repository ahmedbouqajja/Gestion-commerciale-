# Smart Promo AI — Application de bureau (Windows)

Transforme la plateforme web (backend Express + frontend Next.js) en une
**application Windows installable**, qui fonctionne **hors-ligne**, **sans Docker**
et **sans serveur de base de données** : les données sont stockées dans un fichier
**SQLite** local.

## Comment ça marche

L'application Electron lance le backend (avec le Node intégré à Electron) puis
affiche dans une fenêtre native l'interface, **servie par ce même backend** sur un
port local. Un seul processus, un seul port, aucune dépendance externe.

```
Electron (main.js)
  ├─ copie template.db → %APPDATA%/Smart Promo AI/smartpromo.db  (1er lancement)
  ├─ démarre  resources/app/backend/dist/index.js   (Express + Prisma/SQLite)
  └─ ouvre    http://127.0.0.1:47713  → interface + API
```

Données utilisateur (base, config, journaux) :
`C:\Users\<vous>\AppData\Roaming\Smart Promo AI\`

## Prérequis (machine de build uniquement)

- Node.js ≥ 20 et npm
- Connexion internet pour le **premier** `npm install` (télécharge Electron) et
  pour télécharger la police du frontend lors du build.

## Construire l'installateur

```bash
cd desktop
npm install            # installe Electron + electron-builder (une seule fois)
npm run dist           # prépare les ressources puis génère l'installateur .exe
```

L'installateur est généré dans `desktop/dist-installer/` :
`Smart Promo AI Setup <version>.exe`. Double-clic pour installer (raccourci
bureau + menu Démarrer créés automatiquement).

> Astuce : `npm run dist:dir` génère une version décompressée (dossier) sans
> installateur — pratique pour tester rapidement.

## Tester sans packager (dev)

```bash
# 1) Construire les sorties que l'app embarque
cd backend  && npm run build
cd frontend && set NEXT_OUTPUT=export&& set NEXT_PUBLIC_API_URL=/api&& npx next build

# 2) Lancer l'app Electron sur ces sorties
cd desktop && npm start
```

## Connexion de démonstration

L'application est livrée avec une base pré-remplie :

- **Email** : `admin@smartpromo.ma`
- **Mot de passe** : `demo1234`

Importez ensuite vos propres données (ventes, produits, magasins…) depuis la page
**Import**. Tout est sauvegardé localement dans SQLite.

## Notes

- L'installateur n'est pas signé numériquement : Windows SmartScreen peut afficher
  un avertissement au premier lancement (« Informations complémentaires » →
  « Exécuter quand même »). La signature de code nécessite un certificat payant.
- Pour repartir d'une base vierge, fermez l'app et supprimez
  `%APPDATA%\Smart Promo AI\smartpromo.db` (elle sera recréée au prochain lancement).
