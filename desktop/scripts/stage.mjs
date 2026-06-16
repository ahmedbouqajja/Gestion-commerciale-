/**
 * Prépare `desktop/resources/app/` pour electron-builder :
 *   - backend/   : code compilé + node_modules de production + moteur Prisma
 *   - frontend/  : interface Next.js exportée en statique
 *   - template.db: base SQLite pré-remplie (copiée dans userData au 1er lancement)
 *
 * Lancer depuis desktop/ :  node scripts/stage.mjs   (ou `npm run stage`)
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.join(__dirname, "..");
const repoRoot = path.join(desktopRoot, "..");
const backendDir = path.join(repoRoot, "backend");
const frontendDir = path.join(repoRoot, "frontend");

const resourcesApp = path.join(desktopRoot, "resources", "app");
const stagedBackend = path.join(resourcesApp, "backend");
const stagedFrontend = path.join(resourcesApp, "frontend");
const templateDb = path.join(resourcesApp, "template.db");

function step(title) {
  console.log(`\n\x1b[1m▶ ${title}\x1b[0m`);
}
function run(cmd, cwd, env) {
  console.log(`  $ ${cmd}  (cwd: ${path.relative(repoRoot, cwd) || "."})`);
  execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, ...env } });
}
/** file: URL absolue, séparateurs `/` (compatibles Windows + Prisma). */
function fileUrl(p) {
  return "file:" + p.split(path.sep).join("/");
}

// 1. Compiler le backend (TypeScript → dist/)
step("Compilation du backend (tsc)");
run("npm run build", backendDir);

// 2. Exporter le frontend en statique avec une URL d'API relative
step("Export statique du frontend (Next.js)");
run("npx next build", frontendDir, { NEXT_OUTPUT: "export", NEXT_PUBLIC_API_URL: "/api" });

// 3. Réinitialiser le dossier de staging
step("Préparation du dossier resources/app");
fs.rmSync(resourcesApp, { recursive: true, force: true });
fs.mkdirSync(stagedBackend, { recursive: true });
fs.mkdirSync(stagedFrontend, { recursive: true });

// 4. Générer la base modèle (schéma + données de démo)
step("Génération de la base SQLite modèle (template.db)");
const dbEnv = { DATABASE_URL: fileUrl(templateDb) };
run("npx prisma db push --skip-generate --accept-data-loss", backendDir, dbEnv);
run("npx tsx prisma/seed.ts", backendDir, dbEnv);

// 5. Copier les fichiers du backend (sans .env, sans node_modules, sans la base de dev)
step("Copie du backend compilé");
fs.cpSync(path.join(backendDir, "dist"), path.join(stagedBackend, "dist"), { recursive: true });
fs.mkdirSync(path.join(stagedBackend, "prisma"), { recursive: true });
fs.copyFileSync(
  path.join(backendDir, "prisma", "schema.prisma"),
  path.join(stagedBackend, "prisma", "schema.prisma"),
);
fs.copyFileSync(path.join(backendDir, "package.json"), path.join(stagedBackend, "package.json"));

// 6. Installer les dépendances de production + générer le client Prisma (moteur natif)
step("Installation des dépendances backend (production) + Prisma generate");
// Install complet (le postinstall `prisma generate` a besoin du CLI prisma),
// puis élagage des dépendances de dev → node_modules minimal pour l'exécution.
run("npm install --no-audit --no-fund --no-workspaces", stagedBackend);
run("npm prune --omit=dev --no-workspaces", stagedBackend);

// 7. Copier le frontend exporté
step("Copie du frontend exporté");
fs.cpSync(path.join(frontendDir, "out"), stagedFrontend, { recursive: true });

// Note : aucune clé Claude n'est embarquée dans l'installateur (choix de
// sécurité). L'utilisateur saisit sa clé une fois dans Paramètres → elle est
// stockée localement dans %APPDATA%\smart-promo-desktop\config.json.

// 8. Récapitulatif
step("Staging terminé");
const sizeMB = (dir) => {
  let total = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else total += fs.statSync(p).size;
    }
  };
  try {
    walk(dir);
  } catch {
    /* noop */
  }
  return (total / 1024 / 1024).toFixed(0);
};
console.log(`  backend  : ${sizeMB(stagedBackend)} Mo`);
console.log(`  frontend : ${sizeMB(stagedFrontend)} Mo`);
console.log(`  template : ${(fs.statSync(templateDb).size / 1024).toFixed(0)} Ko`);
console.log(`\n✓ Prêt pour : electron-builder --win nsis\n`);
