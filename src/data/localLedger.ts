import { SHEET_TABS, TRANSACTION_HEADERS, validateSheet, type SchemaCheck } from "../domain/contract";
import { buildSeed } from "../domain/seed";
import { todayISO } from "../domain/money";
import { parseLedger, withRowNumbers } from "../domain/parse";
import type { NewTransaction, ParsedRow, RawRow, RowIssue, StoredRow } from "../domain/types";

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
  const raw: RawRow[] = withRowNumbers(rows);
  const parsed = parseLedger(raw);
  return {
    rows: parsed.rows,
    issues: parsed.issues,
    schema: validateSheet({ tabs: [...SHEET_TABS], headers: [...TRANSACTION_HEADERS] }),
    syncedAt: new Date(),
    isSample: sample,
  };
}

function writeStored(rows: StoredRow[], sample: boolean) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows, sample }));
}
