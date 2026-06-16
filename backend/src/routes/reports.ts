import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { buildReportData, generateReport } from "../services/reports/reportService.js";
import { PERIOD_LABEL, type ReportPeriod } from "../services/reports/commentary.js";
import type { ReportFormat } from "../services/reports/types.js";

/**
 *   GET /api/reports/preview?period=monthly         → JSON (KPIs + commentary)
 *   GET /api/reports/:period.:format                → download (pdf | xlsx)
 */
const router = Router();
router.use(authenticate);

const PERIODS: ReportPeriod[] = ["weekly", "monthly", "quarterly"];
const FORMATS: ReportFormat[] = ["pdf", "xlsx"];

const isPeriod = (v: string): v is ReportPeriod => (PERIODS as string[]).includes(v);
const isFormat = (v: string): v is ReportFormat => (FORMATS as string[]).includes(v);

router.get("/types", (_req, res) => {
  res.json({
    periods: PERIODS.map((p) => ({ value: p, label: PERIOD_LABEL[p] })),
    formats: FORMATS,
  });
});

router.get("/preview", async (req, res, next) => {
  try {
    const period = String(req.query.period ?? "monthly");
    if (!isPeriod(period)) return res.status(400).json({ error: "Période invalide." });
    const data = await buildReportData(req.auth?.tenantId, period);
    res.json({
      tenantName: data.tenantName,
      period: data.period,
      generatedAt: data.generatedAt,
      kpis: data.dashboard.kpis,
      commentary: data.commentary,
      recommendationsCount: data.recommendations.length,
    });
  } catch (e) {
    next(e);
  }
});

// e.g. /api/reports/monthly.pdf
router.get("/:file", async (req, res, next) => {
  try {
    const [period, format] = req.params.file.split(".");
    if (!period || !format || !isPeriod(period) || !isFormat(format)) {
      return res.status(400).json({ error: "Requête invalide. Utilisez /api/reports/{weekly|monthly|quarterly}.{pdf|xlsx}." });
    }
    const report = await generateReport(req.auth?.tenantId, period, format);
    res.setHeader("Content-Type", report.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${report.filename}"`);
    res.send(report.buffer);
  } catch (e) {
    next(e);
  }
});

export default router;
