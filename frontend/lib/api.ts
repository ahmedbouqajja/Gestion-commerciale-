/** Thin API client for the Smart Promo AI backend. */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const TOKEN_KEY = "spa_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    // Session expirée / token invalide → on nettoie et on renvoie vers la connexion.
    if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/auth/")) {
      clearToken();
      window.location.href = "/login";
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Erreur ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  dashboard: () => request<DashboardSummary>("/dashboard"),
  context: () => request<EngineContext>("/context"),
  recommendations: () => request<{ recommendations: Recommendation[]; weather: WeatherForecast[] }>("/recommendations"),
  products: () => request<{ products: ProductRow[] }>("/products"),
  stores: () => request<{ stores: StoreRow[] }>("/stores"),
  users: () => request<{ users: UserRow[] }>("/auth/users"),
  createUser: (input: { fullName: string; email: string; password: string; role: string }) =>
    request<UserRow>("/auth/users", { method: "POST", body: JSON.stringify(input) }),
  billing: () => request<BillingInfo>("/auth/billing"),
  forecast: (sku: string) => request<ForecastResponse>(`/forecast/${sku}`),
  assistant: (question: string) =>
    request<{ intent: string; answer: string; data?: unknown }>("/assistant", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),

  importFile: async (entity: ImportEntity, file: File, dryRun: boolean): Promise<ImportReport> => {
    const form = new FormData();
    form.append("file", file);
    const token = getToken();
    const res = await fetch(`${API_URL}/import/${entity}?dryRun=${dryRun ? "1" : "0"}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form, // browser sets multipart boundary
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `Erreur ${res.status}`);
    }
    return res.json() as Promise<ImportReport>;
  },

  downloadTemplate: async (entity: ImportEntity) => {
    const token = getToken();
    const res = await fetch(`${API_URL}/import/${entity}/template`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error("Téléchargement du modèle impossible.");
    await triggerDownload(await res.blob(), `modele_${entity}.xlsx`);
  },

  reportPreview: (period: ReportPeriod) => request<ReportPreview>(`/reports/preview?period=${period}`),

  downloadReport: async (period: ReportPeriod, format: "pdf" | "xlsx") => {
    const token = getToken();
    const res = await fetch(`${API_URL}/reports/${period}.${format}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error("Génération du rapport impossible.");
    await triggerDownload(await res.blob(), `rapport_${period}.${format}`);
  },
};

async function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Import ─────────────────────────────────────────────────────────────────
export type ImportEntity = "products" | "stores" | "stock" | "achats" | "sales";
export interface RowError {
  row: number;
  field?: string;
  message: string;
}
export interface ImportReport {
  entity: ImportEntity;
  mode: "PERSISTED" | "DRY_RUN" | "DEMO";
  totalRows: number;
  validRows: number;
  invalidRows: number;
  persisted: number;
  errors: RowError[];
  preview: Record<string, unknown>[];
}

// ─── Reports ────────────────────────────────────────────────────────────────
export type ReportPeriod = "weekly" | "monthly" | "quarterly";
export interface ReportPreview {
  tenantName: string;
  period: ReportPeriod;
  generatedAt: string;
  kpis: KpiCard[];
  commentary: string[];
  recommendationsCount: number;
}

// ─── Types mirrored from the backend ────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
  tenantName: string;
}
export interface KpiCard {
  label: string;
  value: number;
  unit?: "MAD" | "%";
  changePct?: number;
}
export interface Mover {
  sku: string;
  name: string;
  revenue: number;
  changePct: number;
}
export interface StorePerformance {
  code: string;
  name: string;
  revenue: number;
  changePct: number;
}
export interface Alert {
  level: "INFO" | "WARNING" | "CRITICAL";
  message: string;
}
export interface DashboardSummary {
  kpis: KpiCard[];
  topGrowers: Mover[];
  topDecliners: Mover[];
  topStores: StorePerformance[];
  strugglingStores: StorePerformance[];
  alerts: Alert[];
}
export interface WeatherForecast {
  date: string;
  tempC: number;
  rainMm: number;
  tags: string[];
}
export interface CalendarEvent {
  tag: string;
  name: string;
  startsInDays: number;
  productKinds: string[];
  weight: number;
}
export interface EngineContext {
  weather: WeatherForecast[];
  events: CalendarEvent[];
}
export interface RecommendedAction {
  type: string;
  label: string;
  value?: number;
}
export interface Recommendation {
  sku: string;
  productName: string;
  title: string;
  rationale: string;
  actions: RecommendedAction[];
  estimatedUplift: number;
  confidence: number;
  drivers: string[];
  revenueAtRisk?: number;
  wasteAtRisk?: number;
}
export interface ProductRow {
  sku: string;
  name: string;
  category: string;
  unitPrice: number;
  seasonal: boolean;
  stock: number;
  reorderPoint: number;
  daysOfCover: number | null;
  shelfLifeDays: number | null;
  nearestExpiryDays: number | null;
}
export interface StoreRow {
  code: string;
  name: string;
  banner: string;
  city: string;
  region: string;
  salesRep?: string;
  route?: string;
  deliveryDays?: string[];
}
export interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
}
export interface BillingInfo {
  tenantName: string;
  plan: string;
  currency: string;
  country: string;
  since: string | null;
}
export interface ForecastPoint {
  dayOffset: number;
  value: number;
}
export interface ForecastResult {
  horizon: number;
  daily: ForecastPoint[];
  total: number;
  dailyAverage: number;
  trendPerDay: number;
  confidence: number;
}
export interface ForecastResponse {
  sku: string;
  name: string;
  d7: ForecastResult;
  d30: ForecastResult;
  d90: ForecastResult;
  d365: ForecastResult;
}
