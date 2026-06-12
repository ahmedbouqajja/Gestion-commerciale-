import { Router } from "express";
import multer from "multer";
import { authenticate, authorize } from "../middleware/auth.js";
import { importSpreadsheet } from "../services/import/importService.js";
import { ENTITY_DEFS, type ImportEntity } from "../services/import/schemas.js";

/**
 * Data import endpoints (Excel / CSV) with automatic validation.
 *   GET  /api/import/:entity/template   → CSV template
 *   POST /api/import/:entity            → validate (+ persist unless ?dryRun=1)
 */
const router = Router();
router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const ENTITIES = Object.keys(ENTITY_DEFS) as ImportEntity[];

function isEntity(v: string): v is ImportEntity {
  return (ENTITIES as string[]).includes(v);
}

router.get("/:entity/template", (req, res) => {
  const entity = req.params.entity;
  if (!isEntity(entity)) return res.status(404).json({ error: "Entité inconnue." });
  const def = ENTITY_DEFS[entity];
  const lines = [def.templateHeaders.join(","), ...def.templateRows.map((r) => r.join(","))];
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="modele_${entity}.csv"`);
  res.send(lines.join("\n"));
});

router.post(
  "/:entity",
  authorize("TENANT_ADMIN", "COMMERCIAL_DIRECTOR", "ZONE_MANAGER", "STORE_MANAGER", "ANALYST"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      const entity = req.params.entity;
      if (!isEntity(entity)) return res.status(404).json({ error: "Entité inconnue." });
      if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu (champ « file »)." });

      const dryRun = req.query.dryRun === "1" || req.query.dryRun === "true";
      const report = await importSpreadsheet({
        entity,
        buffer: req.file.buffer,
        filename: req.file.originalname,
        tenantId: req.auth?.tenantId,
        persist: !dryRun,
      });
      res.json(report);
    } catch (e) {
      next(e);
    }
  },
);

export default router;
