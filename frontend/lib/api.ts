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
  forecast: (sku: string) => request<ForecastResponse>(`/forecast/${sku}`),
  assistant: (question: string) =>
    request<{ intent: string; answer: string; data?: unknown }>("/assistant", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
};

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
}
export interface StoreRow {
  code: string;
  name: string;
  banner: string;
  city: string;
  region: string;
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
