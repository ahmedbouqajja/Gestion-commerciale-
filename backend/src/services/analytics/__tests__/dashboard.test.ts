import { describe, expect, it } from "vitest";
import { buildDashboard, type SaleRecord } from "../dashboard.js";

const asOf = new Date("2026-06-12T00:00:00Z");
const DAY = 86_400_000;

/** A sale `daysAgo` before `asOf`. */
function sale(daysAgo: number, revenue: number, returnedRevenue = 0): SaleRecord {
  return {
    date: new Date(asOf.getTime() - daysAgo * DAY),
    productSku: "P1",
    productName: "Yaourt nature x4",
    storeCode: "C1",
    storeName: "Supérette Al Baraka",
    quantity: 100,
    revenue,
    returnedQuantity: returnedRevenue ? 5 : 0,
    returnedRevenue,
  };
}

describe("dashboard returns KPI", () => {
  it("computes the return rate over the trailing 30 days", () => {
    // 10 days each with 1000 revenue and 60 returned → 6% return rate.
    const records = Array.from({ length: 10 }, (_, i) => sale(i + 1, 1000, 60));
    const dash = buildDashboard(records, asOf);

    const rate = dash.kpis.find((k) => k.label.includes("Taux de retour"));
    expect(rate).toBeDefined();
    expect(rate!.unit).toBe("%");
    expect(rate!.value).toBe(6);

    const value = dash.kpis.find((k) => k.label.includes("Valeur retours"));
    expect(value!.value).toBe(600);

    // A return rate ≥ 5% raises an alert.
    expect(dash.alerts.some((a) => a.message.includes("Taux de retour élevé"))).toBe(true);
  });

  it("omits the returns KPI when no returns are tracked", () => {
    const records = Array.from({ length: 10 }, (_, i) => sale(i + 1, 1000));
    const dash = buildDashboard(records, asOf);
    expect(dash.kpis.some((k) => k.label.includes("retour"))).toBe(false);
  });
});
