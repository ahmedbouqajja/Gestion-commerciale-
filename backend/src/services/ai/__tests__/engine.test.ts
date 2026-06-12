import { describe, expect, it } from "vitest";
import { analyzeProduct, generateRecommendations } from "../recommendationEngine.js";
import { forecastDemand } from "../forecast.js";
import { getCalendarEvents } from "../calendar.js";
import { tagsForWeather } from "../weather.js";
import type { ProductSnapshot, WeatherForecast } from "../../../types/domain.js";

const baseProduct: ProductSnapshot = {
  sku: "TEST-1",
  name: "Produit Test",
  category: "BEVERAGE",
  unitPrice: 10,
  costPrice: 6,
  seasonal: true,
  weatherTags: ["HEAT"],
  salesHistory: Array.from({ length: 30 }, () => 100),
  stock: 5000,
  reorderPoint: 1000,
};

const hotWeather: WeatherForecast[] = Array.from({ length: 5 }, (_, i) => ({
  date: `2026-07-0${i + 1}`,
  tempC: 35,
  rainMm: 0,
  tags: ["HEAT"],
}));

describe("weather tagging", () => {
  it("flags heatwave and rain", () => {
    expect(tagsForWeather(40, 0)).toContain("HEATWAVE");
    expect(tagsForWeather(20, 5)).toContain("RAIN");
    expect(tagsForWeather(20, 0)).toEqual(["MILD"]);
  });
});

describe("recommendation engine", () => {
  it("recommends a promotion when weather drives demand", () => {
    const rec = analyzeProduct(baseProduct, { weather: hotWeather, events: [] });
    expect(rec).not.toBeNull();
    expect(rec!.drivers).toContain("WEATHER");
    expect(rec!.actions.some((a) => a.type === "DISCOUNT")).toBe(true);
    expect(rec!.estimatedUplift).toBeGreaterThan(0);
  });

  it("flags stock-out risk, prioritises supplier order and quantifies revenue at risk", () => {
    const lowStock: ProductSnapshot = { ...baseProduct, stock: 50, weatherTags: [] };
    const rec = analyzeProduct(lowStock, { weather: [], events: [] });
    expect(rec).not.toBeNull();
    expect(rec!.drivers).toContain("STOCKOUT");
    expect(rec!.actions[0].type).toBe("SUPPLIER_ORDER");
    // 100 u/j × 7 j − 50 en stock = 650 u × 10 MAD = 6500 MAD menacés.
    expect(rec!.revenueAtRisk).toBe(6500);
  });

  it("returns null when there is no actionable signal", () => {
    const flat: ProductSnapshot = { ...baseProduct, weatherTags: [], seasonal: false };
    expect(analyzeProduct(flat, { weather: [{ date: "2026-05-01", tempC: 20, rainMm: 0, tags: ["MILD"] }], events: [] })).toBeNull();
  });

  it("ranks stock-out risks first", () => {
    const opportunity = { ...baseProduct, sku: "OPP" };
    const risk = { ...baseProduct, sku: "RISK", stock: 50, weatherTags: [] as never[] };
    const recs = generateRecommendations([opportunity, risk], { weather: hotWeather, events: [] });
    expect(recs[0].drivers).toContain("STOCKOUT");
  });

  it("flags expiry risk for an overstocked short-dated batch and quantifies waste", () => {
    // 100 u/j, batch expires in 3 days → only 300 sellable, 5000 in stock.
    const perishable: ProductSnapshot = { ...baseProduct, weatherTags: [], seasonal: false, shelfLifeDays: 5, nearestExpiryDays: 3 };
    const rec = analyzeProduct(perishable, { weather: [], events: [] });
    expect(rec).not.toBeNull();
    expect(rec!.drivers).toContain("EXPIRY");
    // (5000 − 100×3) = 4700 u × 6 MAD coût = 28 200 MAD de pertes potentielles.
    expect(rec!.wasteAtRisk).toBe(28200);
    expect(rec!.actions.some((a) => a.type === "CLEARANCE")).toBe(true);
  });

  it("does not flag expiry when the batch can sell through in time", () => {
    // Long shelf life remaining → nothing perishes.
    const fresh: ProductSnapshot = { ...baseProduct, weatherTags: [], seasonal: false, shelfLifeDays: 30, nearestExpiryDays: 20 };
    const rec = analyzeProduct(fresh, { weather: [], events: [] });
    expect(rec).toBeNull();
  });

  it("prioritises stock-out over expiry (no contradictory signals)", () => {
    // Low stock + short DLC: it will sell out, so it is a rupture, not a péremption.
    const lowAndShort: ProductSnapshot = { ...baseProduct, stock: 50, weatherTags: [], nearestExpiryDays: 2 };
    const rec = analyzeProduct(lowAndShort, { weather: [], events: [] });
    expect(rec!.drivers).toContain("STOCKOUT");
    expect(rec!.drivers).not.toContain("EXPIRY");
  });
});

describe("forecast", () => {
  it("projects an increasing trend", () => {
    const rising = Array.from({ length: 30 }, (_, i) => 100 + i * 2);
    const f = forecastDemand(rising, 7);
    expect(f.trendPerDay).toBeGreaterThan(0);
    expect(f.daily).toHaveLength(7);
    expect(f.total).toBeGreaterThan(0);
  });
});

describe("calendar", () => {
  it("detects an ongoing Ramadan window in 2026", () => {
    const events = getCalendarEvents(new Date("2026-03-01"), 30);
    expect(events.some((e) => e.tag === "RAMADAN" && e.startsInDays === 0)).toBe(true);
  });
});
