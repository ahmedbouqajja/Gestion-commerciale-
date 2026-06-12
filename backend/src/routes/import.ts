import { Router } from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import { authenticate, authorize } from "../middleware/auth.js";
import { importSpreadsheet } from "../services/import/importService.js";
import { ENTITY_DEFS, type ImportEntity } from "../services/import/schemas.js";
import { invalidateTenant } from "../services/intelligence.js";

/**
 * Data import endpoints (Excel / CSV) with automatic validation.
 *   GET  /api/import/:entity/template   → Excel (.xlsx) template
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

router.get("/:entity/template", async (req, res, next) => {
  try {
    const entity = req.params.entity;
    if (!isEntity(entity)) return res.status(404).json({ error: "Entité inconnue." });
    const def = ENTITY_DEFS[entity];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(def.label);

    // Header row (bold) + an example row so the expected format is obvious.
    sheet.addRow(def.templateHeaders);
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF1F5" } };
    for (const r of def.templateRows) sheet.addRow(r);

    // Reasonable column widths based on header length.
    sheet.columns = def.templateHeaders.map((h) => ({ width: Math.max(14, h.length + 4) }));

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="modele_${entity}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    next(e);
  }
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
      // Imported data changes the analytics → drop cached aggregates.
      if (report.mode === "PERSISTED") invalidateTenant(req.auth?.tenantId);
      res.json(report);
    } catch (e) {
      next(e);
    }
  },
);

export default router;
