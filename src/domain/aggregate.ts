import { monthEnd, shiftMonth } from "./money";
import type { ParsedRow, Receipt } from "./types";

export type MonthPoint = {
  key: string;
  label: string;
  income: number;
  expense: number;
};

export type DayPoint = {
  key: string;
  label: string;
  amount: number;
  isToday: boolean;
};

export type CategorySlice = {
  categoryL1: string;
  categoryL2: string;
  amount: number;
  share: number;
};

export function groupReceipts(rows: ParsedRow[]): Receipt[] {
  const groups = new Map<string, ParsedRow[]>();
  for (const row of rows) {
    const list = groups.get(row.transactionId);
    if (list) list.push(row);
    else groups.set(row.transactionId, [row]);
  }

  const receipts: Receipt[] = [];
  for (const [transactionId, lines] of groups) {
    lines.sort((a, b) => a.rowNumber - b.rowNumber);
    const first = lines[0];
    const categories = [...new Set(lines.map((line) => line.categoryL1))];
    receipts.push({
      transactionId,
      date: first.date,
      type: first.type,
      notes: first.notes,
      lines,
      total: lines.reduce((sum, line) => sum + line.amount, 0),
      categories,
    });
  }

  receipts.sort((a, b) => b.date.localeCompare(a.date) || b.lines[0].rowNumber - a.lines[0].rowNumber);
  return receipts;
}

export function groupByMonth(receipts: Receipt[]): { key: string; receipts: Receipt[] }[] {
  const groups: { key: string; receipts: Receipt[] }[] = [];
  for (const receipt of receipts) {
    const key = receipt.date.slice(0, 7);
    const current = groups[groups.length - 1];
    if (current?.key === key) current.receipts.push(receipt);
    else groups.push({ key, receipts: [receipt] });
  }
  return groups;
}

export function receiptMatches(receipt: Receipt, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    receipt.notes,
    receipt.type,
    receipt.categories.join(" "),
    ...receipt.lines.flatMap((line) => [line.categoryL1, line.categoryL2, line.itemName, line.notes]),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function monthTotals(rows: ParsedRow[], month: string) {
  const inMonth = rows.filter((row) => row.date.startsWith(month) && row.type !== "TRANSFER");
  const income = sum(inMonth.filter((row) => row.type === "INCOME"));
  const expense = sum(inMonth.filter((row) => row.type === "EXPENSE"));
  return {
    income,
    expense,
    net: income - expense,
    receipts: new Set(inMonth.map((row) => row.transactionId)).size,
    skus: inMonth.length,
  };
}

export function trailingMonthSeries(rows: ParsedRow[], anchor: string, count = 6): MonthPoint[] {
  const current = anchor.slice(0, 7);
  const points: MonthPoint[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const key = shiftMonth(`${current}-01`, -offset);
    const totals = monthTotals(rows, key);
    points.push({
      key,
      label: new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(
        new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1)),
      ),
      income: totals.income,
      expense: totals.expense,
    });
  }
  return points;
}

export function trailingExpenseDays(rows: ParsedRow[], anchor: string, count = 7): DayPoint[] {
  const points: DayPoint[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const key = addUtcDays(anchor, -offset);
    const amount = rows
      .filter((row) => row.date === key && row.type === "EXPENSE")
      .reduce((total, row) => total + row.amount, 0);
    points.push({
      key,
      label: String(Number(key.slice(8, 10))),
      amount,
      isToday: key === anchor,
    });
  }
  return points;
}

export function categoryBreakdown(rows: ParsedRow[], from: string, to: string): CategorySlice[] {
  const expenses = rows.filter((row) => row.type === "EXPENSE" && row.date >= from && row.date <= to);
  const buckets = new Map<string, CategorySlice>();
  for (const row of expenses) {
    const categoryL2 = row.categoryL2 || "—";
    const key = `${row.categoryL1}\u0000${categoryL2}`;
    const current = buckets.get(key);
    if (current) current.amount += row.amount;
    else buckets.set(key, { categoryL1: row.categoryL1, categoryL2, amount: row.amount, share: 0 });
  }
  const total = [...buckets.values()].reduce((sum, slice) => sum + slice.amount, 0);
  return [...buckets.values()]
    .map((slice) => ({ ...slice, share: total === 0 ? 0 : slice.amount / total }))
    .sort((a, b) => b.amount - a.amount || a.categoryL1.localeCompare(b.categoryL1));
}

export function rangeForPreset(preset: "month" | "six" | "all", anchor: string): { from: string; to: string } {
  const month = anchor.slice(0, 7);
  if (preset === "all") return { from: "0000-01-01", to: "9999-12-31" };
  if (preset === "six") return { from: `${shiftMonth(`${month}-01`, -5)}-01`, to: monthEnd(month) };
  return { from: `${month}-01`, to: monthEnd(month) };
}

function sum(rows: ParsedRow[]): number {
  return rows.reduce((total, row) => total + row.amount, 0);
}

function addUtcDays(iso: string, delta: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}
