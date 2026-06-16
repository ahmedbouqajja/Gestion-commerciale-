"use strict";

/**
 * Smart Promo AI — processus principal Electron.
 *
 * Rôle : démarrer le backend (Express + Prisma/SQLite) comme processus enfant
 * en utilisant le Node intégré à Electron, puis afficher l'interface (servie
 * par ce même backend) dans une fenêtre native. Aucune dépendance externe :
 * pas de Docker, pas de navigateur, pas de serveur de base de données.
 */

const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");

const isDev = !app.isPackaged;
const PREFERRED_PORT = 47713; // port fixe (origine stable → session conservée)

let mainWindow = null;
let backendProcess = null;
let isQuitting = false;

// ─── Emplacements (diffèrent en dev et en version packagée) ──────────────────

function getPaths() {
  const userData = app.getPath("userData");
  if (isDev) {
    // En dev on tourne sur les sorties de build du dépôt.
    const repo = path.join(__dirname, "..");
    return {
      userData,
      backendDir: path.join(repo, "backend"),
      backendEntry: path.join(repo, "backend", "dist", "index.js"),
      frontendDir: path.join(repo, "frontend", "out"),
      templateDb: path.join(repo, "backend", "prisma", "dev.db"),
    };
  }
  // En version packagée : tout est sous resources/app (voir extraResources).
  const root = path.join(process.resourcesPath, "app");
  return {
    userData,
    backendDir: path.join(root, "backend"),
    backendEntry: path.join(root, "backend", "dist", "index.js"),
    frontendDir: path.join(root, "frontend"),
    templateDb: path.join(root, "template.db"),
  };
}

// ─── Config persistante (secret JWT + port) ─────────────────────────────────

function loadConfig(userData) {
  const file = path.join(userData, "config.json");
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    config = {};
  }
  let changed = false;
  if (!config.jwtSecret) {
    config.jwtSecret = crypto.randomBytes(48).toString("hex");
    changed = true;
  }
  if (!config.port) {
    config.port = PREFERRED_PORT;
    changed = true;
  }
  // La clé Claude (anthropicApiKey) est écrite ici par le backend quand
  // l'utilisateur la saisit dans Paramètres — pas besoin de l'initialiser.
  if (changed) {
    try {
      fs.mkdirSync(userData, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(config, null, 2));
    } catch (e) {
      log(`Impossible d'écrire config.json : ${e.message}`);
    }
  }
  return { config, file };
}

function saveConfig(file, config) {
  try {
    fs.writeFileSync(file, JSON.stringify(config, null, 2));
  } catch (e) {
    log(`Impossible de sauvegarder config.json : ${e.message}`);
  }
}

// ─── Base de données : copie du modèle au premier lancement ──────────────────

function ensureDatabase(paths) {
  const dbPath = path.join(paths.userData, "smartpromo.db");
  if (!fs.existsSync(dbPath)) {
    if (fs.existsSync(paths.templateDb)) {
      fs.mkdirSync(paths.userData, { recursive: true });
      fs.copyFileSync(paths.templateDb, dbPath);
      log(`Base initialisée depuis le modèle → ${dbPath}`);
    } else {
      log(`ATTENTION : modèle de base introuvable (${paths.templateDb}).`);
    }
  }
  return dbPath;
}

// ─── Réseau : choix d'un port libre ──────────────────────────────────────────

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

function getEphemeralPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function resolvePort(preferred) {
  if (await isPortFree(preferred)) return preferred;
  return getEphemeralPort();
}

// ─── Journalisation (fichier dans userData/logs) ─────────────────────────────

let logStream = null;
function initLog(userData) {
  try {
    const dir = path.join(userData, "logs");
    fs.mkdirSync(dir, { recursive: true });
    logStream = fs.createWriteStream(path.join(dir, "desktop.log"), { flags: "a" });
  } catch {
    logStream = null;
  }
}
function log(line) {
  const msg = `[${new Date().toISOString()}] ${line}\n`;
  if (logStream) logStream.write(msg);
  process.stdout.write(msg);
}

// ─── Démarrage du backend ────────────────────────────────────────────────────

function startBackend(paths, port, dbPath, config) {
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1", // exécute le binaire Electron comme un Node nu
    NODE_ENV: "production",
    PORT: String(port),
    // Prisma SQLite : chemin absolu, séparateurs `/` (compatibles Windows).
    DATABASE_URL: `file:${dbPath.split(path.sep).join("/")}`,
    JWT_SECRET: config.jwtSecret,
    STATIC_DIR: paths.frontendDir,
    CORS_ORIGIN: "*",
    // Source de vérité des réglages IA : la clé Claude est lue/écrite ici par le
    // backend (saisie via Paramètres). Elle reste sur le poste de l'utilisateur.
    APP_CONFIG_PATH: path.join(paths.userData, "config.json"),
  };

  log(`Démarrage backend : ${paths.backendEntry} (port ${port})`);
  const child = spawn(process.execPath, [paths.backendEntry], {
    cwd: paths.backendDir,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (d) => log(`[backend] ${d.toString().trimEnd()}`));
  child.stderr.on("data", (d) => log(`[backend:err] ${d.toString().trimEnd()}`));
  child.on("exit", (code, signal) => {
    log(`Backend terminé (code=${code}, signal=${signal}).`);
    if (!isQuitting) {
      dialog.showErrorBox(
        "Smart Promo AI",
        "Le moteur de l'application s'est arrêté de façon inattendue.\n" +
          `Consultez le journal : ${path.join(paths.userData, "logs", "desktop.log")}`,
      );
      app.quit();
    }
  });

  return child;
}

// ─── Attente de disponibilité du backend (health check) ──────────────────────

function waitForHealth(port, timeoutMs = 40000) {
  const deadline = Date.now() + timeoutMs;
  const url = `http://127.0.0.1:${port}/health`;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode === 200) return resolve();
        retry();
      });
      req.on("error", retry);
      req.setTimeout(2000, () => req.destroy());
    };
    const retry = () => {
      if (Date.now() > deadline) return reject(new Error("Le backend n'a pas répondu à temps."));
      setTimeout(attempt, 400);
    };
    attempt();
  });
}

// ─── Fenêtre ──────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 880,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: "#0f172a",
    title: "Smart Promo AI",
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Écran de chargement le temps que le backend démarre.
  mainWindow.loadFile(path.join(__dirname, "loading.html"));
  mainWindow.once("ready-to-show", () => mainWindow.show());

  // Liens externes → navigateur par défaut, pas dans la fenêtre de l'app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const template = [
    {
      label: "Fichier",
      submenu: [{ role: "quit", label: "Quitter" }],
    },
    {
      label: "Édition",
      submenu: [
        { role: "undo", label: "Annuler" },
        { role: "redo", label: "Rétablir" },
        { type: "separator" },
        { role: "cut", label: "Couper" },
        { role: "copy", label: "Copier" },
        { role: "paste", label: "Coller" },
        { role: "selectAll", label: "Tout sélectionner" },
      ],
    },
    {
      label: "Affichage",
      submenu: [
        { role: "reload", label: "Recharger" },
        { role: "resetZoom", label: "Zoom normal" },
        { role: "zoomIn", label: "Zoom avant" },
        { role: "zoomOut", label: "Zoom arrière" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Plein écran" },
        ...(isDev ? [{ role: "toggleDevTools", label: "Outils de développement" }] : []),
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── Cycle de vie ──────────────────────────────────────────────────────────────

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    const paths = getPaths();
    initLog(paths.userData);
    log(`Démarrage Smart Promo AI (dev=${isDev}).`);

    buildMenu();
    createWindow();

    try {
      const { config, file } = loadConfig(paths.userData);
      const dbPath = ensureDatabase(paths);
      const port = await resolvePort(config.port || PREFERRED_PORT);
      if (port !== config.port) {
        config.port = port;
        saveConfig(file, config);
      }

      backendProcess = startBackend(paths, port, dbPath, config);
      await waitForHealth(port);
      log("Backend prêt — chargement de l'interface.");
      if (mainWindow) await mainWindow.loadURL(`http://127.0.0.1:${port}/`);
    } catch (err) {
      log(`Échec du démarrage : ${err && err.message}`);
      dialog.showErrorBox(
        "Smart Promo AI — erreur de démarrage",
        `${err && err.message}\n\nJournal : ${path.join(paths.userData, "logs", "desktop.log")}`,
      );
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on("window-all-closed", () => {
    app.quit();
  });

  app.on("before-quit", () => {
    isQuitting = true;
    if (backendProcess && !backendProcess.killed) {
      log("Arrêt du backend.");
      backendProcess.kill();
    }
  });
}
