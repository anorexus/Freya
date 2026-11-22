import { CATEGORIES } from "./categories";
import { CATEGORY_HEADERS, SHEET_TABS, TRANSACTION_HEADERS, WALLET_HEADERS } from "../domain/contract";
import type { NewTransaction, StoredRow } from "../domain/types";

const SHEET_KEY = "freya.sheet.v1";

export type SheetLink = {
  id: string;
  title: string;
};

export type SheetGrid = {
  title: string;
  tabs: string[];
  headers: string[];
  dataRows: string[][];
};

export function readSheetLink(): SheetLink | null {
  try {
    const raw = localStorage.getItem(SHEET_KEY);
    if (!raw) return null;
    const link = JSON.parse(raw) as SheetLink;
    return link.id ? link : null;
  } catch {
    return null;
  }
}

export function writeSheetLink(link: SheetLink) {
  localStorage.setItem(SHEET_KEY, JSON.stringify(link));
}

export function sheetUrl(id: string): string {
  return `https://docs.google.com/spreadsheets/d/${id}`;
}

export function transactionRows(input: NewTransaction): StoredRow[] {
  const transactionId = crypto.randomUUID();
  return input.lines.map((line) => ({
    transaction_id: transactionId,
    date: input.date,
    type: input.type,
    amount: String(line.amount),
    category_l1: line.categoryL1,
    category_l2: line.categoryL2,
    item_name: line.itemName,
    notes: input.notes,
    wallet_id: "Main Cash",
    beneficiary: "Self",
  }));
}

export async function createFreyaSheet(accessToken: string): Promise<SheetLink> {
  const created = await googleJson<{ spreadsheetId: string }>(accessToken, "https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    body: JSON.stringify({
      properties: { title: "Freya Ledger" },
      sheets: SHEET_TABS.map((title) => ({ properties: { title } })),
    }),
  });

  await googleJson(accessToken, `https://sheets.googleapis.com/v4/spreadsheets/${created.spreadsheetId}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: [
        { range: "Transactions!A1", values: [[...TRANSACTION_HEADERS]] },
        { range: "Config_Categories!A1", values: [[...CATEGORY_HEADERS], ...categoryRows()] },
        { range: "Assets_Wallets!A1", values: [[...WALLET_HEADERS]] },
      ],
    }),
  });

  const link = { id: created.spreadsheetId, title: "Freya Ledger" };
  writeSheetLink(link);
  return link;
}

export async function readFreyaSheet(accessToken: string, spreadsheetId: string): Promise<SheetGrid> {
  const meta = await googleJson<{
    properties?: { title?: string };
    sheets?: { properties?: { title?: string } }[];
  }>(
    accessToken,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`,
  );
  const values = await googleJson<{ values?: string[][] }>(
    accessToken,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("Transactions")}?majorDimension=ROWS`,
  );
  const grid = values.values ?? [];
  return {
    title: meta.properties?.title || "Freya Ledger",
    tabs: (meta.sheets ?? []).map((sheet) => sheet.properties?.title || "").filter(Boolean),
    headers: (grid[0] ?? []).map((cell) => String(cell ?? "").trim()),
    dataRows: grid
      .slice(1)
      .map((row) => row.map((cell) => String(cell ?? "")))
      .filter((row) => row.some((cell) => cell.trim() !== "")),
  };
}

export async function appendTransactions(accessToken: string, spreadsheetId: string, rows: StoredRow[]) {
  const values = rows.map((row) => TRANSACTION_HEADERS.map((header) => row[header]));
  await googleJson(
    accessToken,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("Transactions!A1")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({ majorDimension: "ROWS", values }),
    },
  );
}

function categoryRows(): string[][] {
  const rows: string[][] = [];
  for (const category of CATEGORIES) {
    if (category.l2.length === 0) {
      rows.push([category.type, category.l1, "", ""]);
      continue;
    }
    for (const sub of category.l2) rows.push([category.type, category.l1, sub, ""]);
  }
  return rows;
}

async function googleJson<T>(accessToken: string, url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    let message = `Google request failed (${response.status}).`;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      /* The status line is enough. */
    }
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return (await response.json()) as T;
}
