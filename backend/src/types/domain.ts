/**
 * Domain types shared across the AI engine, analytics and API layers.
 * These are intentionally decoupled from Prisma models so the intelligence
 * core can be unit-tested with plain objects (see src/demo.ts and tests).
 */

export type WeatherTag =
  | "HEAT"
  | "COLD"
  | "RAIN"
  | "HEATWAVE"
  | "MILD";

export type CalendarTag =
  | "RAMADAN"
  | "AID_AL_FITR"
  | "AID_AL_ADHA"
  | "BACK_TO_SCHOOL"
  | "SUMMER"
  | "WINTER"
  | "HOLIDAYS"
  | "NEW_YEAR";

export type Driver = "WEATHER" | "CALENDAR" | "SEASON" | "STOCKOUT" | "TREND";

export type ActionType =
  | "DISCOUNT"
  | "ENDCAP" // tête de gondole
  | "TASTING" // animation dégustation
  | "STOCK_UP"
  | "TRANSFER"
  | "SUPPLIER_ORDER"
  | "SUBSTITUTE"
  | "BUNDLE";

export interface RecommendedAction {
  type: ActionType;
  label: string;
  value?: number; // e.g. discount % or stock increase %
}

export interface ProductSnapshot {
  sku: string;
  name: string;
  category: string; // kind: FRESH, DAIRY, BEVERAGE, FROZEN, MEAT, FISH, GROCERY
  unitPrice: number;
  costPrice: number;
  seasonal: boolean;
  weatherTags: WeatherTag[];
  /** Daily units sold, oldest first. */
  salesHistory: number[];
  /** Current on-hand stock units. */
  stock: number;
  /** Reorder threshold. */
  reorderPoint: number;
}

export interface WeatherForecast {
  date: string; // ISO date
  tempC: number;
  rainMm: number;
  tags: WeatherTag[];
}

export interface CalendarEvent {
  tag: CalendarTag;
  name: string; // human label (FR)
  startsInDays: number; // 0 = ongoing
  productKinds: string[]; // affinity categories
  weight: number; // 0..1 commercial importance
}

export interface Recommendation {
  sku: string;
  productName: string;
  title: string;
  rationale: string;
  actions: RecommendedAction[];
  estimatedUplift: number; // %
  confidence: number; // 0..1
  drivers: Driver[];
  /** For stock-out risks: revenue threatened over the next week (MAD). */
  revenueAtRisk?: number;
}
