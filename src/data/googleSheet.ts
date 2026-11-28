import { CATEGORIES } from "./categories";
import { CATEGORY_HEADERS, SHEET_TABS, TRANSACTION_HEADERS, WALLET_HEADERS } from "../domain/contract";
import type { NewTransaction, StoredRow } from "../domain/types";

const SHEET_KEY = "freya.sheet.v1";
const LEDGER_MARK = { freya: "ledger", schema: "v1" };

export type SheetLink = {
  id: string;
  title: string;
};

export type LedgerCandidate = {
  id: string;
  title: string;
  modifiedTime: string;
};

export type SheetGrid = {
  title: string;
  tabs: string[];
  headers: string[];
  dataRows: string[][];
  categoryHeaders: string[];
  categoryRows: string[][];
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

export function clearSheetLink() {
  localStorage.removeItem(SHEET_KEY);
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
  const created = await googleJson<{ id: string }>(accessToken, "https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    body: JSON.stringify({
      name: "Freya Ledger",
      mimeType: "application/vnd.google-apps.spreadsheet",
      appProperties: LEDGER_MARK,
    }),
  });

  try {
    const meta = await googleJson<{ sheets?: { properties?: { sheetId?: number; title?: string } }[] }>(
      accessToken,
      `https://sheets.googleapis.com/v4/spreadsheets/${created.id}?fields=sheets.properties`,
    );
    const firstSheetId = meta.sheets?.[0]?.properties?.sheetId ?? 0;
    await googleJson(accessToken, `https://sheets.googleapis.com/v4/spreadsheets/${created.id}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            updateSheetProperties: {
              properties: { sheetId: firstSheetId, title: SHEET_TABS[0] },
              fields: "title",
            },
          },
          ...SHEET_TABS.slice(1).map((title) => ({ addSheet: { properties: { title } } })),
        ],
      }),
    });
    await googleJson(accessToken, `https://sheets.googleapis.com/v4/spreadsheets/${created.id}/values:batchUpdate`, {
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
  } catch (error) {
    await fetch(`https://www.googleapis.com/drive/v3/files/${created.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => undefined);
    throw error;
  }

  const link = { id: created.id, title: "Freya Ledger" };
  writeSheetLink(link);
  return link;
}

export async function listFreyaLedgers(accessToken: string): Promise<LedgerCandidate[]> {
  const query = [
    "mimeType='application/vnd.google-apps.spreadsheet'",
    "trashed=false",
    "(appProperties has { key='freya' and value='ledger' } or name='Freya Ledger')",
  ].join(" and ");
  const params = new URLSearchParams({
    q: query,
    fields: "files(id,name,modifiedTime)",
    orderBy: "modifiedTime desc",
    pageSize: "20",
    spaces: "drive",
  });
  const body = await googleJson<{ files?: { id?: string; name?: string; modifiedTime?: string }[] }>(
    accessToken,
    `https://www.googleapis.com/drive/v3/files?${params}`,
  );
  return (body.files ?? [])
    .filter((file): file is { id: string; name?: string; modifiedTime?: string } => Boolean(file.id))
    .map((file) => ({
      id: file.id,
      title: file.name || "Freya Ledger",
      modifiedTime: file.modifiedTime ?? "",
    }));
}

export async function stampFreyaLedger(accessToken: string, spreadsheetId: string) {
  await googleJson(accessToken, `https://www.googleapis.com/drive/v3/files/${spreadsheetId}`, {
    method: "PATCH",
    body: JSON.stringify({ appProperties: LEDGER_MARK }),
  });
}

export async function readFreyaSheet(accessToken: string, spreadsheetId: string): Promise<SheetGrid> {
  const meta = await googleJson<{
    properties?: { title?: string };
    sheets?: { properties?: { title?: string } }[];
  }>(
    accessToken,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`,
  );
  const batch = await googleJson<{ valueRanges?: { values?: string[][] }[] }>(
    accessToken,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${encodeURIComponent("Transactions")}&ranges=${encodeURIComponent("Config_Categories")}&majorDimension=ROWS`,
  );
  const transactions = batch.valueRanges?.[0]?.values ?? [];
  const categories = batch.valueRanges?.[1]?.values ?? [];
  return {
    title: meta.properties?.title || "Freya Ledger",
    tabs: (meta.sheets ?? []).map((sheet) => sheet.properties?.title || "").filter(Boolean),
    headers: headerCells(transactions[0]),
    dataRows: bodyRows(transactions),
    categoryHeaders: headerCells(categories[0]),
    categoryRows: bodyRows(categories),
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
    rows.push([category.type, category.l1, "", category.icon, category.color, ""]);
    for (const sub of category.l2) rows.push([category.type, category.l1, sub, "", "", ""]);
  }
  return rows;
}

function headerCells(row: string[] | undefined): string[] {
  return (row ?? []).map((cell) => String(cell ?? "").trim());
}

function bodyRows(grid: string[][]): string[][] {
  return grid
    .slice(1)
    .map((row) => row.map((cell) => String(cell ?? "")))
    .filter((row) => row.some((cell) => cell.trim() !== ""));
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
      if (body.error?.message) {
        message = body.error.message.includes("insufficient authentication scopes")
          ? "Google did not grant Freya permission to create a file. Sign out, sign in again, and allow access to files Freya creates."
          : body.error.message;
      }
    } catch {
      /* The status line is enough. */
    }
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return (await response.json()) as T;
}
