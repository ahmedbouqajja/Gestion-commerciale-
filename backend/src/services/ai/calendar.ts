import type { CalendarEvent, CalendarTag } from "../../types/domain.js";

/**
 * Marketing calendar intelligence.
 *
 * Detects commercially relevant periods (Ramadan, Aïd, back-to-school,
 * seasons...) for a given date and exposes the product categories that
 * historically over-perform during each, so the recommendation engine can
 * anticipate demand a few weeks ahead.
 *
 * Islamic dates vary each year and are derived from the Hijri calendar; the
 * Gregorian equivalents below are the official/observed dates for Morocco.
 * Extend this table yearly (or wire a Hijri library) as needed.
 */

interface FixedWindow {
  tag: CalendarTag;
  name: string;
  start: string; // ISO (year included)
  end: string;
  productKinds: string[];
  weight: number;
}

const ISLAMIC_WINDOWS: FixedWindow[] = [
  // Ramadan
  { tag: "RAMADAN", name: "Ramadan", start: "2025-03-01", end: "2025-03-29", productKinds: ["DAIRY", "GROCERY", "BEVERAGE", "FRESH"], weight: 1 },
  { tag: "RAMADAN", name: "Ramadan", start: "2026-02-18", end: "2026-03-19", productKinds: ["DAIRY", "GROCERY", "BEVERAGE", "FRESH"], weight: 1 },
  { tag: "RAMADAN", name: "Ramadan", start: "2027-02-08", end: "2027-03-08", productKinds: ["DAIRY", "GROCERY", "BEVERAGE", "FRESH"], weight: 1 },
  // Aïd al-Fitr (end of Ramadan)
  { tag: "AID_AL_FITR", name: "Aïd Al Fitr", start: "2025-03-30", end: "2025-04-01", productKinds: ["DAIRY", "GROCERY", "FRESH"], weight: 0.9 },
  { tag: "AID_AL_FITR", name: "Aïd Al Fitr", start: "2026-03-20", end: "2026-03-22", productKinds: ["DAIRY", "GROCERY", "FRESH"], weight: 0.9 },
  // Aïd al-Adha (Aïd el-Kebir)
  { tag: "AID_AL_ADHA", name: "Aïd Al Adha", start: "2025-06-06", end: "2025-06-09", productKinds: ["MEAT", "GROCERY"], weight: 1 },
  { tag: "AID_AL_ADHA", name: "Aïd Al Adha", start: "2026-05-27", end: "2026-05-30", productKinds: ["MEAT", "GROCERY"], weight: 1 },
];

const DATE = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return DATE(y, m, d);
}

/** Season + recurring secular events derived purely from month/day. */
function seasonalEvents(today: Date): CalendarEvent[] {
  const month = today.getUTCMonth() + 1;
  const day = today.getUTCDate();
  const events: CalendarEvent[] = [];

  // Back-to-school: late August → mid September
  if ((month === 8 && day >= 20) || (month === 9 && day <= 15)) {
    events.push({
      tag: "BACK_TO_SCHOOL",
      name: "Rentrée scolaire",
      startsInDays: 0,
      productKinds: ["GROCERY", "BEVERAGE", "DAIRY"],
      weight: 0.8,
    });
  }
  // Summer
  if (month >= 6 && month <= 8) {
    events.push({ tag: "SUMMER", name: "Été", startsInDays: 0, productKinds: ["BEVERAGE", "FROZEN", "FRESH"], weight: 0.7 });
  }
  // Winter
  if (month === 12 || month <= 2) {
    events.push({ tag: "WINTER", name: "Hiver", startsInDays: 0, productKinds: ["BEVERAGE", "GROCERY"], weight: 0.6 });
  }
  // New year / fêtes
  if (month === 12 && day >= 20) {
    events.push({ tag: "NEW_YEAR", name: "Fêtes de fin d'année", startsInDays: 0, productKinds: ["BEVERAGE", "GROCERY", "FROZEN"], weight: 0.7 });
  }
  return events;
}

/**
 * Returns events that are ongoing OR upcoming within `horizonDays`.
 * `startsInDays === 0` means the event is currently active.
 */
export function getCalendarEvents(today: Date = new Date(), horizonDays = 30): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const w of ISLAMIC_WINDOWS) {
    const start = parse(w.start);
    const end = parse(w.end);
    const toStart = daysBetween(today, start);
    const toEnd = daysBetween(today, end);

    if (toEnd < 0) continue; // already over
    const ongoing = toStart <= 0 && toEnd >= 0;
    if (!ongoing && toStart > horizonDays) continue; // too far out

    events.push({
      tag: w.tag,
      name: w.name,
      startsInDays: ongoing ? 0 : toStart,
      productKinds: w.productKinds,
      weight: w.weight,
    });
  }

  events.push(...seasonalEvents(today));

  // Soonest / most important first.
  return events.sort((a, b) => a.startsInDays - b.startsInDays || b.weight - a.weight);
}
