import { SHEET_TABS, TRANSACTION_HEADERS, validateSheet, type SchemaCheck } from "../domain/contract";
import { buildSeed } from "../domain/seed";
import { todayISO } from "../domain/money";
import { parseLedger, withRowNumbers } from "../domain/parse";
import type { NewTransaction, ParsedRow, RowIssue, StoredRow } from "../domain/types";

const STORAGE_KEY = "freya.ledger.v2";

export type LedgerSnapshot = {
  rows: ParsedRow[];
  issues: RowIssue[];
  schema: SchemaCheck;
  syncedAt: Date;
  isSample: boolean;
};

export function loadSnapshot(): LedgerSnapshot {
  const stored = readStored();
  return snapshotFrom(stored.rows, stored.sample);
}

export function saveTransaction(current: StoredRow[], input: NewTransaction): StoredRow[] {
  const transactionId = crypto.randomUUID();
  const next = [
    ...current,
    ...input.lines.map((line) => ({
      transaction_id: transactionId,
      date: input.date,
      type: input.type,
      amount: Number.isInteger(line.amount) ? String(line.amount) : String(line.amount),
      category_l1: line.categoryL1,
      category_l2: line.categoryL2,
      item_name: line.itemName,
      notes: input.notes,
      wallet_id: "Main Cash",
      beneficiary: "Self",
    })),
  ];
  writeStored(next, false);
  return next;
}

export function replaceLedger(rows: StoredRow[], sample: boolean) {
  writeStored(rows, sample);
}

export function readStored(): { rows: StoredRow[]; sample: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = buildSeed(todayISO());
      writeStored(seeded, true);
      return { rows: seeded, sample: true };
    }
    const parsed = JSON.parse(raw) as { rows?: StoredRow[]; sample?: boolean } | StoredRow[];
    if (Array.isArray(parsed)) return { rows: parsed, sample: false };
    return { rows: parsed.rows ?? [], sample: Boolean(parsed.sample) };
  } catch {
    return { rows: [], sample: false };
  }
}

export function snapshotFrom(rows: StoredRow[], sample: boolean): LedgerSnapshot {
  return snapshotFromGrid([...TRANSACTION_HEADERS], rows.map(storedToCells), [...SHEET_TABS], sample);
}

export function snapshotFromGrid(headers: string[], dataRows: string[][], tabs: string[], sample: boolean): LedgerSnapshot {
  const stored = dataRows.map((cells) => rowFromCells(headers, cells));
  const parsed = parseLedger(withRowNumbers(stored));
  return {
    rows: parsed.rows,
    issues: parsed.issues,
    schema: validateSheet({ tabs, headers }),
    syncedAt: new Date(),
    isSample: sample,
  };
}

function storedToCells(row: StoredRow): string[] {
  return TRANSACTION_HEADERS.map((header) => row[header]);
}

function rowFromCells(headers: string[], cells: string[]): StoredRow {
  const value = (name: keyof StoredRow) => {
    const index = headers.indexOf(name);
    return index >= 0 ? String(cells[index] ?? "") : "";
  };
  return {
    transaction_id: value("transaction_id"),
    date: value("date"),
    type: value("type"),
    amount: value("amount"),
    category_l1: value("category_l1"),
    category_l2: value("category_l2"),
    item_name: value("item_name"),
    notes: value("notes"),
    wallet_id: value("wallet_id"),
    beneficiary: value("beneficiary"),
  };
}

function writeStored(rows: StoredRow[], sample: boolean) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows, sample }));
}
