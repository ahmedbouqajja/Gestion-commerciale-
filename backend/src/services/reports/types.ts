import type { DashboardSummary } from "../analytics/dashboard.js";
import type { Recommendation } from "../../types/domain.js";
import type { ReportPeriod } from "./commentary.js";

export interface ReportData {
  tenantName: string;
  currency: string;
  period: ReportPeriod;
  generatedAt: Date;
  dashboard: DashboardSummary;
  recommendations: Recommendation[];
  commentary: string[];
}

export type ReportFormat = "pdf" | "xlsx";
