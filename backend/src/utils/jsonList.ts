/**
 * Encodage/décodage de listes de chaînes pour SQLite.
 *
 * SQLite (via Prisma) ne supporte pas les listes scalaires (`String[]`). Les
 * champs concernés (weatherTags, deliveryDays, drivers…) sont donc stockés en
 * colonne TEXT contenant un tableau JSON. Ces helpers font la traduction aux
 * frontières de la base de données.
 */

/** Tableau de chaînes → chaîne JSON prête à être stockée (jamais null). */
export function encodeList(values: readonly string[] | null | undefined): string {
  return JSON.stringify(values ?? []);
}

/** Chaîne JSON stockée → tableau de chaînes (tolérant : renvoie [] si invalide). */
export function decodeList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
