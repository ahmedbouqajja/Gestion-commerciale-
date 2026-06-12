import { z } from "zod";

/**
 * Per-entity import definitions: column aliases (FR/EN tolerant), a Zod schema
 * for "validation automatique", and a downloadable template. Incoming headers
 * are normalised (lowercased, accent- and separator-stripped) then mapped to
 * canonical field names before validation.
 */

export type ImportEntity = "products" | "stores" | "stock" | "achats" | "sales";

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
    templateRows: [
      ["LAIT-UHT-1L", "Lait UHT demi-écrémé 1 L", "Produits laitiers", "7", "5.2", "non"],
      ["RAIB-180", "Raïb 180 g", "Produits laitiers", "3.5", "2.3", "non"],
    ],
  },

  stores: {
    label: "Clients",
    aliases: {
      code: ["code", "codemagasin", "storecode", "codeclient"],
      name: ["name", "nom", "magasin", "nommagasin", "client"],
      banner: ["banner", "enseigne", "type", "typepdv"],
      city: ["city", "ville"],
      region: ["region"],
    },
    schema: z.object({
      code: str.pipe(z.string().min(1, "Code client requis.")),
      name: str.pipe(z.string().min(1, "Nom requis.")),
      banner: str.optional(),
      city: str.optional(),
      region: str.optional(),
    }),
    templateHeaders: ["code", "nom", "type", "ville", "region"],
    templateRows: [
      ["CASA-SUP01", "Supérette Al Baraka", "Supérette", "Casablanca", "Casablanca-Settat"],
      ["RABAT-GMS01", "Agdal Market", "Grande surface", "Rabat", "Rabat-Salé-Kénitra"],
    ],
  },

  // Inventaire initial du dépôt (saisi une fois). Le stock courant est ensuite
  // calculé automatiquement : initialStock + achats − ventes.
  stock: {
    label: "Inventaire",
    aliases: {
      productSku: ["productsku", "sku", "codeproduit", "produit", "reference"],
      quantity: ["quantity", "quantite", "qte", "stock", "stockactuel", "stockinitial"],
    },
    schema: z.object({
      productSku: str.pipe(z.string().min(1, "SKU produit requis.")),
      quantity: num.pipe(z.number().min(0)),
    }),
    templateHeaders: ["sku", "quantite"],
    templateRows: [["LAIT-UHT-1L", "4000"], ["RAIB-180", "900"]],
  },

  // Achats / réceptions au dépôt (fichier quotidien). Entrées de stock.
  achats: {
    label: "Achats",
    aliases: {
      productSku: ["productsku", "sku", "codeproduit", "produit", "reference"],
      date: ["date", "jour", "dateachat", "datereception"],
      quantity: ["quantity", "quantite", "qte", "volume"],
      unitCost: ["unitcost", "cout", "prixachat", "pa", "coutunitaire"],
    },
    schema: z.object({
      productSku: str.pipe(z.string().min(1, "SKU produit requis.")),
      date: dateField,
      quantity: num.pipe(z.number().min(0)),
      unitCost: num.optional().default(0),
    }),
    templateHeaders: ["sku", "date", "quantite", "prix_achat"],
    templateRows: [["LAIT-UHT-1L", "2026-06-12", "5000", "5.2"]],
  },

  sales: {
    label: "Ventes",
    aliases: {
      productSku: ["productsku", "sku", "codeproduit", "produit", "reference"],
      storeCode: ["storecode", "magasin", "codemagasin", "codeclient"],
      date: ["date", "jour", "datevente"],
      quantity: ["quantity", "quantite", "qte", "volume"],
      revenue: ["revenue", "ca", "chiffreaffaires", "montant", "total", "ventes"],
      promoFlag: ["promo", "promoflag", "enpromo"],
    },
    schema: z.object({
      productSku: str.pipe(z.string().min(1, "SKU produit requis.")),
      storeCode: str.pipe(z.string().min(1, "Code client requis.")),
      date: dateField,
      quantity: num.pipe(z.number().min(0)),
      revenue: num.pipe(z.number().min(0)),
      promoFlag: boolish,
    }),
    templateHeaders: ["sku", "code_client", "date", "quantite", "ca", "promo"],
    templateRows: [["LAIT-UHT-1L", "CASA-SUP01", "2026-06-01", "620", "4340", "non"]],
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
