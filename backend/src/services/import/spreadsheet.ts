import ExcelJS from "exceljs";
import Papa from "papaparse";

/**
 * Parses an uploaded spreadsheet (.xlsx / .xls) or CSV buffer into a uniform
 * list of row objects keyed by their (raw) column headers. The first row is
 * always treated as the header row.
 */

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, unknown>[];
}

export async function parseSpreadsheet(buffer: Buffer, filename: string): Promise<ParsedSheet> {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "csv" || ext === "txt") return parseCsv(buffer);
  if (ext === "xlsx" || ext === "xls") return parseXlsx(buffer);
  throw new Error("Format non supporté. Utilisez .xlsx ou .csv.");
}

function parseCsv(buffer: Buffer): ParsedSheet {
  const result = Papa.parse<Record<string, unknown>>(buffer.toString("utf8"), {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
  });
  return { headers: result.meta.fields ?? [], rows: result.data };
}

async function parseXlsx(buffer: Buffer): Promise<ParsedSheet> {
  const workbook = new ExcelJS.Workbook();
  // exceljs accepts a Node Buffer here despite the ArrayBuffer-typed signature.
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { headers: [], rows: [] };

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    headers[col - 1] = String(cell.value ?? "").trim();
  });

  const rows: Record<string, unknown>[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    if (!row.hasValues) continue;
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      if (!h) return;
      const cell = row.getCell(i + 1);
      obj[h] = normalizeCellValue(cell.value);
    });
    rows.push(obj);
  }
  return { headers: headers.filter(Boolean), rows };
}

/** Flatten exceljs rich values (formulas, hyperlinks, dates) to primitives. */
function normalizeCellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    const v = value as { result?: unknown; text?: unknown };
    if ("result" in v) return v.result;
    if ("text" in v) return v.text;
  }
  return value;
}
