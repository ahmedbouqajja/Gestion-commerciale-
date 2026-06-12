import type { WeatherForecast, WeatherTag } from "../../types/domain.js";

/**
 * Weather intelligence. Uses OpenWeatherMap when OPENWEATHER_API_KEY is set,
 * otherwise produces a deterministic seasonal simulation so the rest of the
 * platform (and the demo) works with zero external dependencies.
 */

/** Translate a raw forecast into commercial weather tags. */
export function tagsForWeather(tempC: number, rainMm: number): WeatherTag[] {
  const tags: WeatherTag[] = [];
  if (tempC >= 38) tags.push("HEATWAVE");
  if (tempC >= 28) tags.push("HEAT");
  if (tempC <= 12) tags.push("COLD");
  if (rainMm >= 2) tags.push("RAIN");
  if (tags.length === 0) tags.push("MILD");
  return tags;
}

/** Product categories that tend to spike under each weather condition. */
export const WEATHER_AFFINITY: Record<WeatherTag, string[]> = {
  HEATWAVE: ["BEVERAGE", "FROZEN"],
  HEAT: ["BEVERAGE", "FROZEN", "FRESH"],
  COLD: ["BEVERAGE", "GROCERY"], // café, thé, soupes
  RAIN: ["BEVERAGE", "GROCERY"],
  MILD: [],
};

function simulate(date: Date): WeatherForecast {
  const month = date.getUTCMonth() + 1;
  // Rough Moroccan seasonal averages.
  const baseTemp = [14, 15, 17, 19, 23, 28, 33, 33, 29, 24, 19, 15][month - 1];
  // Deterministic pseudo-noise from day-of-month so output is stable.
  const noise = ((date.getUTCDate() * 37) % 11) - 5;
  const tempC = baseTemp + noise;
  const rainMm = month >= 11 || month <= 3 ? (date.getUTCDate() % 4 === 0 ? 6 : 0) : 0;
  return { date: date.toISOString().slice(0, 10), tempC, rainMm, tags: tagsForWeather(tempC, rainMm) };
}

interface OWMDay {
  temp: { day: number };
  rain?: number;
}

/**
 * Fetch a multi-day forecast for coordinates. Falls back to a simulation when
 * no API key is configured or the request fails.
 */
export async function getForecast(
  lat: number,
  lon: number,
  days = 5,
  apiKey = process.env.OPENWEATHER_API_KEY,
): Promise<WeatherForecast[]> {
  const today = new Date();

  if (apiKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as { daily?: OWMDay[] };
        return (data.daily ?? []).slice(0, days).map((d, i) => {
          const date = new Date(today.getTime() + i * 86_400_000);
          const tempC = Math.round(d.temp.day);
          const rainMm = d.rain ?? 0;
          return { date: date.toISOString().slice(0, 10), tempC, rainMm, tags: tagsForWeather(tempC, rainMm) };
        });
      }
    } catch {
      // fall through to simulation
    }
  }

  return Array.from({ length: days }, (_, i) => simulate(new Date(today.getTime() + i * 86_400_000)));
}
