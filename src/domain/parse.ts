import { isISODate } from "./money";
import { TX_TYPES, type ParsedRow, type RawRow, type RowIssue, type StoredRow, type TxType } from "./types";

export function withRowNumbers(rows: StoredRow[]): RawRow[] {
  return rows.map((row, index) => ({ ...row, rowNumber: index + 2 }));
}

export function parseLedger(rows: RawRow[]): { rows: ParsedRow[]; issues: RowIssue[] } {
  const parsed: ParsedRow[] = [];
  const issues: RowIssue[] = [];

  for (const row of rows) {
    const reasons: string[] = [];
    if (!row.transaction_id.trim()) reasons.push("missing transaction id");
    if (!isISODate(row.date)) reasons.push("invalid date");
    if (!isTxType(row.type)) reasons.push("invalid type");
    const amount = Number(row.amount);
    if (!Number.isFinite(amount) || amount <= 0) reasons.push("invalid amount");
    if (!row.category_l1.trim()) reasons.push("missing category");

    if (reasons.length > 0 || !isTxType(row.type)) {
      issues.push({ rowNumber: row.rowNumber, reasons: reasons.length > 0 ? reasons : ["invalid row"] });
      continue;
    }

    parsed.push({
      rowNumber: row.rowNumber,
      transactionId: row.transaction_id,
      date: row.date,
      type: row.type,
      amount,
      categoryL1: row.category_l1,
      categoryL2: row.category_l2,
      itemName: row.item_name,
      notes: row.notes,
      walletId: row.wallet_id,
      beneficiary: row.beneficiary,
    });
  }

  return { rows: parsed, issues };
}

function isTxType(value: string): value is TxType {
  return (TX_TYPES as readonly string[]).includes(value);
}
