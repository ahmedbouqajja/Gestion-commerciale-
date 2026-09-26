# Skills Claude Code du projet GCOM

Trois skills importés depuis [ECC](https://github.com/affaan-m/ECC)
(commit `e482e579`, licence MIT, © 2026 Affaan Mustafa). Chaque dossier
contient le `SKILL.md` d'origine **non modifié**, une copie de la `LICENSE`
et un `SOURCE.md` avec le lien exact vers la source.

Ces skills sont de simples fichiers Markdown : ils n'utilisent **ni plugin,
ni hook, ni serveur MCP, ni script**. Ils fonctionnent donc dans Claude Code
sur le web. Claude les charge automatiquement quand la tâche correspond à leur
description, ou à la demande avec `/<nom-du-skill>`.

| Skill | Rôle pour GCOM |
|---|---|
| `python-patterns` | Code Python idiomatique : typage, dataclasses (Client, Facture…), exceptions métier, gestionnaires de contexte pour SQLite |
| `python-testing` | Tests pytest : fixtures, paramétrage, mocks, couverture (calcul des commissions, totaux de factures, stock) |
| `verification-loop` | Vérification avant commit ou PR : types, lint, tests, secrets, relecture du diff |

## Dépendances

Aucune dépendance n'est nécessaire pour charger les skills. Les outils cités
dans les skills doivent être installés pour exécuter les commandes :

| Outil | Présent dans le conteneur web | Installation |
|---|---|---|
| Python 3.11, `sqlite3` | oui | — |
| `ruff`, `black`, `mypy`, `pyright` | oui | — |
| `pytest`, `pytest-cov` | **non** | `pip install pytest pytest-cov` |
| `isort`, `pylint`, `bandit`, `pip-audit`, `safety` | non (facultatifs) | `pip install …` si besoin |
| `pytest-asyncio` | non | inutile : GCOM n'est pas asynchrone |

Pour disposer automatiquement de pytest à chaque session web, on peut ajouter
un hook SessionStart ou un `requirements-dev.txt` installé par le script de
configuration de l'environnement.

## Parties non applicables à ce projet ou à cet environnement

- **Tkinter n'est pas disponible dans le conteneur web** (module `tkinter`
  absent, aucun affichage). Il faut séparer la logique métier (calculs,
  accès SQLite, génération PDF) de l'interface Tkinter et ne tester que la
  logique. Les tests d'interface se lancent en local, sur un poste avec
  affichage.
- `python-testing` : les exemples FastAPI/Flask, `pytest-asyncio` et
  SQLAlchemy (`Session`, `engine`) ne s'appliquent pas. Pour SQLite, utiliser
  une base en mémoire : `sqlite3.connect(":memory:")` dans une fixture.
- `python-testing` / `python-patterns` : remplacer `mypackage` dans
  `--cov=mypackage` par le nom réel du paquet de l'application.
- `verification-loop` :
  - les phases npm/pnpm/TypeScript (`npm run build`, `tsc`, `console.log`)
    ne concernent pas ce projet. Utiliser uniquement les commandes Python
    (`pyright`, `ruff`, `pytest`) ;
  - la recherche de secrets ne vise que `*.ts`/`*.js`. Pour GCOM, cibler
    `--include="*.py"` ;
  - la commande `/verify` citée dans le skill est une commande ECC **non
    incluse** ici (elle dépend du système de commandes ou de plugins d'ECC).
    Invoquer `/verification-loop` à la place ;
  - l'« intégration avec les hooks PostToolUse » dépend des hooks ECC, qui
    ne sont pas installés.
- Le seuil de couverture de 80 % est une recommandation d'ECC. On peut
  l'adapter au projet.

## Utilisation

### `python-patterns`
Se déclenche quand Claude écrit ou relit du code Python. Exemples :
- « Crée le modèle `Facture` en dataclass typée avec validation des montants. »
- `/python-patterns relis gcom/db.py (typage, exceptions, context managers)`

### `python-testing`
Se déclenche quand on écrit des tests pytest. Exemples :
- « Écris les tests pytest du calcul des commissions, paramétrés par taux et palier. »
- `/python-testing ajoute une fixture conftest.py avec une base SQLite en mémoire`

### `verification-loop`
À lancer à la fin d'une tâche, avant un commit ou une PR :
- `/verification-loop`
- Claude exécute alors types (`pyright .`), lint (`ruff check .`), tests
  (`pytest --cov`), la recherche de secrets et la relecture du diff, puis
  produit un rapport `READY / NOT READY`.

## Mise à jour

Pour mettre un skill à jour, recopier `skills/<nom>/` depuis ECC, puis
modifier le commit indiqué dans `SOURCE.md`. Les notes d'adaptation sont
volontairement rassemblées dans ce fichier : les `SKILL.md` restent
identiques à la source.
