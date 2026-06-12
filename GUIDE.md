# Guide d'utilisation — Smart Promo AI

Mode d'emploi pas à pas pour un **distributeur de produits laitiers** qui pilote
ses ventes, ses DLC et ses tournées avec Smart Promo AI.

> Objectif du produit en une phrase : **vendre plus (opportunités) + jeter moins
> (DLC + retours) + ne jamais être en rupture.**

---

## Étape 0 — Mise en place (une seule fois)

1. **Connexion** : ouvrez `http://localhost:3000` → *Connexion*.
   - Démo : `admin@smartpromo.ma` / `demo1234`.
2. **Paramètres** : vérifiez les informations de la société (nom, pays, devise MAD).
3. **Utilisateurs** : ajoutez votre équipe (commerciaux, analystes…) via
   *Ajouter un utilisateur* et attribuez à chacun le rôle adapté.

> ⚠️ La création d'utilisateurs et la persistance des imports nécessitent une base
> de données (`DATABASE_URL`). En mode démo (sans DB), l'application fonctionne en
> lecture sur un jeu de données synthétique.

---

## Étape 1 — Importer les données (les fondations)

L'ordre compte : tout est relié entre les entités.

1. **Clients** — *Importation* → onglet **Clients** → *Télécharger le modèle Excel*
   → remplir (`code`, `nom`, `type`, `ville`, `region`) → importer.
2. **Produits** — `sku`, `nom`, `catégorie`, `prix_unitaire`, `prix_achat`, `saisonnier`.
3. **Inventaire initial** (une seule fois) — `sku`, `quantité` : le stock dépôt de départ.
4. **Ventes** — historique (`sku`, `code_client`, `date`, `quantité`, `ca`) — alimente
   l'intelligence (tendances, prévisions, recommandations).

### Le stock dépôt se calcule tout seul

Vous ne gérez **pas** le stock de vos clients, seulement **votre dépôt**. Le stock
courant est recalculé automatiquement :

```
Stock dépôt = Inventaire initial + Σ Achats (entrées) − Σ Ventes (sorties)
```

Au quotidien, il suffit donc d'importer **deux fichiers** :
- **Ventes (sorties)** — `sku`, `code_client`, `date`, `quantité`, `ca` → diminue le stock ;
- **Achats (entrées)** — `sku`, `date`, `quantité`, `prix_achat` → augmente le stock.

Le **seuil de réapprovisionnement** est calculé automatiquement (≈ 7 jours de
couverture au rythme de vente récent) — rien à saisir.

> 💡 Commencez toujours par **« Valider (sans enregistrer) »** pour contrôler les
> erreurs ligne par ligne avant de persister.

---

## Étape 2 — Routine quotidienne

Chaque matin, faites le tour dans cet ordre :

1. **Tableau de bord** — la vue d'ensemble :
   - CA jour / 7 j / 30 j + évolution vs N-1 ;
   - **Taux de retour** (indicateur clé du distributeur) ;
   - **Alertes** automatiques (produit en chute, client en difficulté, retours élevés…).
2. **Promotions IA** — les décisions, classées par priorité :
   - 🔴 **Risque de rupture** → passer une commande fournisseur en urgence ;
   - 🟡 **Risque de péremption (DLC)** → déstockage / transfert avant la perte ;
   - 🟢 **Opportunités** → offres selon météo / saison / calendrier.
3. **Catalogue produits** — colonne **DLC restante** et statut
   (Sain / Risque rupture / Risque péremption) pour planifier l'approvisionnement.
4. **Clients & Tournées** — préparer les livraisons : qui est livré aujourd'hui,
   quel commercial est responsable, sur quelle tournée.

---

## Étape 3 — Planification & analyse (hebdo / mensuel)

1. **Prévisions** — projeter la demande d'un produit (7 / 30 / 90 / 365 j) pour
   planifier les quantités et les achats.
2. **Assistant IA** — poser des questions directes : « Quel produit promouvoir cette
   semaine ? » → réponse chiffrée et plan d'action, ancrés sur les données.
3. **Rapports** — télécharger un rapport **PDF / Excel** (hebdo / mensuel / trimestriel)
   avec commentaire exécutif auto-généré — pour la direction ou l'archivage.
4. **Facturation** — suivre le plan et les fonctionnalités incluses.

---

## La boucle vertueuse

```
Importer les données  →  Tableau de bord  →  Appliquer les recommandations (Promotions IA)
        ↑                                                        ↓
   Rapports  ←  Surveiller Taux de retour & DLC  ←  Exécuter (commande / déstockage / tournée)
```

---

## Aide-mémoire des pages

| Page | À quoi elle sert |
| --- | --- |
| Tableau de bord | KPIs, taux de retour, mouvements, alertes |
| Promotions IA | Recommandations (rupture, péremption, opportunités) |
| Prévisions | Projections de demande 7/30/90/365 j |
| Catalogue produits | Stock, couverture, DLC restante, statut |
| Clients & Tournées | Points de vente groupés par tournée |
| Types de clients | Répartition des clients par type de commerce |
| Importation | Import Excel/CSV (clients, produits, stocks, ventes) |
| Rapports | Génération PDF / Excel avec synthèse |
| Assistant IA | Questions/réponses sur vos données |
| Utilisateurs | Équipe, rôles, ajout d'utilisateur |
| Facturation | Abonnement et plans |
| Paramètres | Société, préférences, intégrations |
