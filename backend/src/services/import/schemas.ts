import { z } from "zod";

/**
 * Per-entity import definitions: column aliases (FR/EN tolerant), a Zod schema
 * for "validation automatique", and a downloadable template. Incoming headers
 * are normalised (lowercased, accent- and separator-stripped) then mapped to
 * canonical field names before validation.
 */

export type ImportEntity = "products" | "stores" | "stock" | "sales";

export function normalizeKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Booleans expressed in FR/EN spreadsheets.
const boolish = z
  .union([z.boolean(), z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === "") return false;
    if (typeof v === "boolean") return v;
    const s = String(v).trim().toLowerCase();
    return ["1", "true", "oui", "yes", "y", "vrai", "x"].includes(s);
  });

// Dates: JS Date (xlsx), ISO string, or DD/MM/YYYY.
const dateField = z.preprocess((v) => {
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(Math.round((v - 25569) * 86400 * 1000)); // excel serial
  if (typeof v === "string") {
    const s = v.trim();
    const fr = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
    if (fr) return new Date(Date.UTC(+fr[3], +fr[2] - 1, +fr[1]));
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }
  return undefined;
}, z.date({ invalid_type_error: "Date invalide (formats acceptés : AAAA-MM-JJ, JJ/MM/AAAA)." }));

const str = z.preprocess((v) => (v === undefined || v === null ? "" : String(v).trim()), z.string());
const num = z.coerce.number({ invalid_type_error: "Nombre attendu." });

interface EntityDef {
  label: string;
  aliases: Record<string, string[]>; // canonical -> normalized aliases
  schema: z.ZodTypeAny;
  templateHeaders: string[];
  templateRows: string[][];
}

export const ENTITY_DEFS: Record<ImportEntity, EntityDef> = {
  products: {
    label: "Produits",
    aliases: {
      sku: ["sku", "code", "codeproduit", "reference", "ref"],
      name: ["name", "nom", "libelle", "designation", "produit"],
      category: ["category", "categorie", "famille", "rayon"],
      unitPrice: ["unitprice", "prix", "prixunitaire", "prixvente", "pv"],
      costPrice: ["costprice", "cout", "prixachat", "pa", "coutachat"],
      seasonal: ["seasonal", "saisonnier"],
    },
    schema: z.object({
      sku: str.pipe(z.string().min(1, "SKU requis.")),
      name: str.pipe(z.string().min(1, "Nom requis.")),
      category: str.optional(),
      unitPrice: num.pipe(z.number().min(0)),
      costPrice: num.optional().default(0),
      seasonal: boolish,
    }),
    templateHeaders: ["sku", "nom", "categorie", "prix_unitaire", "prix_achat", "saisonnier"],
    templateRows: [["LAIT-450", "Lait 450 ml", "Produits laitiers", "4.5", "3.2", "non"]],
  },

  stores: {
    label: "Magasins",
    aliases: {
      code: ["code", "codemagasin", "storecode"],
      name: ["name", "nom", "magasin", "nommagasin"],
      banner: ["banner", "enseigne"],
      city: ["city", "ville"],
      region: ["region"],
    },
    schema: z.object({
      code: str.pipe(z.string().min(1, "Code magasin requis.")),
      name: str.pipe(z.string().min(1, "Nom requis.")),
      banner: str.optional(),
      city: str.optional(),
      region: str.optional(),
    }),
    templateHeaders: ["code", "nom", "enseigne", "ville", "region"],
    templateRows: [["CASA-01", "Casablanca Maârif", "Marjane", "Casablanca", "Casablanca-Settat"]],
  },

  stock: {
    label: "Stocks",
    aliases: {
      productSku: ["productsku", "sku", "codeproduit", "produit", "reference"],
      storeCode: ["storecode", "code", "magasin", "codemagasin"],
      quantity: ["quantity", "quantite", "qte", "stock", "stockactuel"],
      reorderPoint: ["reorderpoint", "seuil", "seuilreappro", "pointcommande"],
    },
    schema: z.object({
      productSku: str.pipe(z.string().min(1, "SKU produit requis.")),
      storeCode: str.pipe(z.string().min(1, "Code magasin requis.")),
      quantity: num.pipe(z.number().min(0)),
      reorderPoint: num.optional().default(0),
    }),
    templateHeaders: ["sku", "code_magasin", "quantite", "seuil_reappro"],
    templateRows: [["LAIT-450", "CASA-01", "900", "600"]],
  },

  sales: {
    label: "Ventes",
    aliases: {
      productSku: ["productsku", "sku", "codeproduit", "produit", "reference"],
      storeCode: ["storecode", "magasin", "codemagasin"],
      date: ["date", "jour", "datevente"],
      quantity: ["quantity", "quantite", "qte", "volume"],
      revenue: ["revenue", "ca", "chiffreaffaires", "montant", "total", "ventes"],
      promoFlag: ["promo", "promoflag", "enpromo"],
    },
    schema: z.object({
      productSku: str.pipe(z.string().min(1, "SKU produit requis.")),
      storeCode: str.pipe(z.string().min(1, "Code magasin requis.")),
      date: dateField,
      quantity: num.pipe(z.number().min(0)),
      revenue: num.pipe(z.number().min(0)),
      promoFlag: boolish,
    }),
    templateHeaders: ["sku", "code_magasin", "date", "quantite", "ca", "promo"],
    templateRows: [["LAIT-450", "CASA-01", "2026-06-01", "320", "1440", "non"]],
  },
};

/** Map a raw row's headers to canonical field names using the alias table. */
export function mapRow(raw: Record<string, unknown>, aliases: Record<string, string[]>): Record<string, unknown> {
  const normalized = new Map<string, unknown>();
  for (const [k, v] of Object.entries(raw)) normalized.set(normalizeKey(k), v);

  const mapped: Record<string, unknown> = {};
  for (const [canonical, keys] of Object.entries(aliases)) {
    for (const key of keys) {
      if (normalized.has(key)) {
        mapped[canonical] = normalized.get(key);
        break;
      }
    }
  }
  return mapped;
}
