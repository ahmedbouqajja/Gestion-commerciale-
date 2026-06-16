/**
 * Tiny in-memory caching helpers (zero dependencies).
 *
 * Used to avoid recomputing the analytics pipeline and re-calling external
 * services (weather) on every request. Includes in-flight de-duplication so a
 * burst of concurrent requests triggers a single computation (no stampede).
 */

export interface TTLCache<T> {
  get(loader: () => Promise<T>): Promise<T>;
  clear(): void;
}

export function ttlCache<T>(ttlMs: number): TTLCache<T> {
  let entry: { value: T; expires: number } | null = null;
  let inflight: Promise<T> | null = null;

  return {
    async get(loader) {
      const now = Date.now();
      if (entry && entry.expires > now) return entry.value;
      if (inflight) return inflight;
      inflight = loader()
        .then((value) => {
          entry = { value, expires: Date.now() + ttlMs };
          return value;
        })
        .finally(() => {
          inflight = null;
        });
      return inflight;
    },
    clear() {
      entry = null;
      inflight = null;
    },
  };
}

/** Same idea, but keyed (e.g. per SKU / per coordinate / per day). */
export function keyedTTLCache<T>(ttlMs: number) {
  const entries = new Map<string, { value: T; expires: number }>();
  const inflight = new Map<string, Promise<T>>();

  return {
    async get(key: string, loader: () => Promise<T>): Promise<T> {
      const now = Date.now();
      const hit = entries.get(key);
      if (hit && hit.expires > now) return hit.value;
      const pending = inflight.get(key);
      if (pending) return pending;

      const promise = loader()
        .then((value) => {
          entries.set(key, { value, expires: Date.now() + ttlMs });
          return value;
        })
        .finally(() => {
          inflight.delete(key);
        });
      inflight.set(key, promise);
      return promise;
    },
    clear() {
      entries.clear();
      inflight.clear();
    },
  };
}
