import { describe, expect, it } from "vitest";
import { importSpreadsheet } from "../importService.js";

const csv = (s: string) => ({ buffer: Buffer.from(s, "utf8"), filename: "test.csv" });

describe("import validation (CSV)", () => {
  it("accepts a valid products file with FR headers and aliases", async () => {
    const file = csv(
      [
        "code,nom,categorie,prix,saisonnier",
        "LAIT-450,Lait 450 ml,Produits laitiers,4.5,non",
        "EAU-1.5L,Eau minérale,Boissons,6,oui",
      ].join("\n"),
    );
    const report = await importSpreadsheet({ entity: "products", ...file, persist: false });
    expect(report.totalRows).toBe(2);
    expect(report.validRows).toBe(2);
    expect(report.invalidRows).toBe(0);
    expect(report.mode).toBe("DRY_RUN");
    expect(report.preview[0]).toMatchObject({ sku: "LAIT-450", unitPrice: 4.5, seasonal: false });
    expect(report.preview[1]).toMatchObject({ seasonal: true });
  });

  it("reports row-level errors for invalid data", async () => {
    const file = csv(["sku,nom,prix", "OK-1,Produit valide,10", ",Sans SKU,5", "BAD,Prix invalide,abc"].join("\n"));
    const report = await importSpreadsheet({ entity: "products", ...file, persist: false });
    expect(report.validRows).toBe(1);
    expect(report.invalidRows).toBe(2);
    expect(report.errors.some((e) => e.row === 2 && e.field === "sku")).toBe(true);
    expect(report.errors.some((e) => e.row === 3 && e.field === "unitPrice")).toBe(true);
  });

  it("parses dates (ISO and DD/MM/YYYY) for sales", async () => {
    const file = csv(
      ["sku,code_magasin,date,quantite,ca", "LAIT-450,CASA-01,2026-06-01,10,45", "LAIT-450,CASA-01,01/06/2026,10,45"].join("\n"),
    );
    const report = await importSpreadsheet({ entity: "sales", ...file, persist: false });
    expect(report.validRows).toBe(2);
    expect((report.preview[0].date as Date) instanceof Date).toBe(true);
  });

  it("falls back to DEMO mode when persistence is requested without a database", async () => {
    const file = csv(["code,nom", "CASA-01,Casa Maârif"].join("\n"));
    const report = await importSpreadsheet({ entity: "stores", ...file, persist: true });
    expect(report.mode).toBe("DEMO");
    expect(report.persisted).toBe(0);
    expect(report.validRows).toBe(1);
  });
});
