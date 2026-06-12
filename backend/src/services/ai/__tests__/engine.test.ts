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

  it("flags stock-out risk and prioritises supplier order", () => {
    const lowStock: ProductSnapshot = { ...baseProduct, stock: 50, weatherTags: [] };
    const rec = analyzeProduct(lowStock, { weather: [], events: [] });
    expect(rec).not.toBeNull();
    expect(rec!.drivers).toContain("STOCKOUT");
    expect(rec!.actions[0].type).toBe("SUPPLIER_ORDER");
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
