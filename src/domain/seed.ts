import { addDays, formatMonth } from "./money";
import type { StoredRow } from "./types";

type CatalogGroup = { l2: string; items: string[] };

const CATALOG: Record<string, CatalogGroup[]> = {
  Groceries: [
    { l2: "Dairy", items: ["Fresh Milk 1L", "Eggs 10pcs", "Yogurt"] },
    { l2: "Produce", items: ["Spinach", "Bananas", "Tomatoes"] },
    { l2: "Staples", items: ["Rice 5kg", "Cooking oil", "Sugar"] },
    { l2: "Snacks", items: ["Roasted peanuts", "Crackers"] },
  ],
  Transport: [
    { l2: "Ride", items: ["Gojek", "GrabBike"] },
    { l2: "Fuel", items: ["Pertamax"] },
    { l2: "Transit", items: ["KRL commute"] },
  ],
  Food: [
    { l2: "Cafe", items: ["Filter coffee", "Butter croissant"] },
    { l2: "Restaurant", items: ["Nasi goreng", "Soto"] },
  ],
  Housing: [{ l2: "Rent", items: ["Monthly rent"] }],
  Utilities: [
    { l2: "Electric", items: ["PLN bill"] },
    { l2: "Internet", items: ["Home internet"] },
    { l2: "Phone", items: ["Mobile data"] },
  ],
  Health: [
    { l2: "Pharmacy", items: ["Vitamin C"] },
    { l2: "Clinic", items: ["Clinic visit"] },
  ],
  Shopping: [
    { l2: "Clothes", items: ["Cotton shirt"] },
    { l2: "Home", items: ["Dish soap"] },
  ],
};

const FILLER_CATEGORIES = ["Groceries", "Transport", "Food", "Utilities", "Health", "Shopping"] as const;

const MONTH_TARGETS: Record<number, { income: number; expense: number }> = {
  [-5]: { income: 15_800_000, expense: 9_200_000 },
  [-4]: { income: 15_200_000, expense: 10_400_000 },
  [-3]: { income: 16_800_000, expense: 8_600_000 },
  [-2]: { income: 14_900_000, expense: 12_100_000 },
  [-1]: { income: 16_500_000, expense: 6_960_000 },
};

/**
 * Deterministic sample ledger.
 * November (the anchor month) matches the design specimen:
 * income 18.500.000, expense 7.240.000, 42 receipts, 118 SKU lines, plus one dirty amount.
 */
export function buildSeed(anchor: string): StoredRow[] {
  const rand = mulberry32(20261122);
  const rows: StoredRow[] = [];

  for (let offset = -5; offset <= -1; offset += 1) {
    const monthStart = shiftMonthStart(anchor, offset);
    const target = MONTH_TARGETS[offset];
    rows.push(...buildPastMonth(monthStart, target.income, target.expense, rand));
  }

  rows.push(...buildAnchorMonth(anchor, rand));

  const dirty: StoredRow = blank({
    transaction_id: "seed-dirty",
    date: addDays(anchor, -8),
    type: "EXPENSE",
    amount: "twelve",
    category_l1: "Groceries",
    notes: "Typed by hand",
  });
  rows.splice(12, 0, dirty);
  return rows;
}

function buildAnchorMonth(anchor: string, rand: () => number): StoredRow[] {
  const rows: StoredRow[] = [];
  const monthLabel = formatMonth(anchor);

  rows.push(
    blank({
      transaction_id: "seed-salary",
      date: addDays(anchor, -1),
      type: "INCOME",
      amount: "18500000",
      category_l1: "Salary",
      notes: monthLabel,
    }),
  );

  rows.push(
    ...lines("seed-groceries", anchor, "EXPENSE", "Superindo", [
      ["24500", "Groceries", "Dairy", "Fresh Milk 1L"],
      ["32000", "Groceries", "Dairy", "Eggs 10pcs"],
      ["8900", "Groceries", "Produce", "Spinach"],
      ["121000", "Groceries", "Staples", "Rice 5kg"],
    ]),
  );

  rows.push(
    blank({
      transaction_id: "seed-transport",
      date: addDays(anchor, -2),
      type: "EXPENSE",
      amount: "42000",
      category_l1: "Transport",
      notes: "Gojek",
    }),
  );

  rows.push(
    ...lines("seed-food", addDays(anchor, -4), "EXPENSE", "Coffee", [
      ["38000", "Food", "Cafe", "Filter coffee"],
      ["30000", "Food", "Cafe", "Butter croissant"],
    ]),
  );

  const namedExpense = 186_400 + 42_000 + 68_000;
  const remaining = 7_240_000 - namedExpense;
  const lineCounts = [...Array(4).fill(2), ...Array(34).fill(3)];
  const receiptTotals = splitTotal(remaining, lineCounts.length, rand);
  const anchorDay = Number(anchor.slice(8, 10));
  const reserved = new Set([anchor, addDays(anchor, -1), addDays(anchor, -2), addDays(anchor, -4)]);

  lineCounts.forEach((count: number, index) => {
    const date = fillerDate(anchor, anchorDay, index, reserved);
    const amounts = splitTotal(receiptTotals[index], count, rand);
    const id = `seed-fill-${String(index + 1).padStart(2, "0")}`;
    const category = FILLER_CATEGORIES[Math.floor(rand() * FILLER_CATEGORIES.length)];
    amounts.forEach((amount) => {
      const group = CATALOG[category][Math.floor(rand() * CATALOG[category].length)];
      const item = group.items[Math.floor(rand() * group.items.length)];
      rows.push(
        blank({
          transaction_id: id,
          date,
          type: "EXPENSE",
          amount: String(amount),
          category_l1: category,
          category_l2: group.l2,
          item_name: item,
        }),
      );
    });
  });

  assertAnchorMonth(rows, anchor);
  return rows;
}

function assertAnchorMonth(rows: StoredRow[], anchor: string) {
  const month = anchor.slice(0, 7);
  const inMonth = rows.filter((row) => row.date.startsWith(month));
  const income = inMonth.filter((row) => row.type === "INCOME").reduce((sum, row) => sum + Number(row.amount), 0);
  const expense = inMonth.filter((row) => row.type === "EXPENSE").reduce((sum, row) => sum + Number(row.amount), 0);
  const receipts = new Set(inMonth.map((row) => row.transaction_id)).size;
  if (income !== 18_500_000 || expense !== 7_240_000 || receipts !== 42 || inMonth.length !== 118) {
    throw new Error(
      `Sample ledger drifted: income ${income}, expense ${expense}, receipts ${receipts}, rows ${inMonth.length}`,
    );
  }
}

function buildPastMonth(monthStart: string, income: number, expense: number, rand: () => number): StoredRow[] {
  const rows: StoredRow[] = [];
  const month = monthStart.slice(0, 7);
  rows.push(
    blank({
      transaction_id: `seed-salary-${month}`,
      date: `${month}-21`,
      type: "INCOME",
      amount: String(income),
      category_l1: "Salary",
      notes: formatMonth(monthStart),
    }),
  );

  const receiptCount = 14;
  const totals = splitTotal(expense, receiptCount, rand);
  totals.forEach((total, index) => {
    const count = index % 3 === 0 ? 2 : 1;
    const amounts = splitTotal(total, count, rand);
    const day = String((index % 26) + 1).padStart(2, "0");
    const id = `seed-${month}-${index + 1}`;
    const category = FILLER_CATEGORIES[Math.floor(rand() * FILLER_CATEGORIES.length)];
    amounts.forEach((amount) => {
      const group = CATALOG[category][Math.floor(rand() * CATALOG[category].length)];
      const item = group.items[Math.floor(rand() * group.items.length)];
      rows.push(
        blank({
          transaction_id: id,
          date: `${month}-${day}`,
          type: "EXPENSE",
          amount: String(amount),
          category_l1: category,
          category_l2: group.l2,
          item_name: item,
        }),
      );
    });
  });
  return rows;
}

function fillerDate(anchor: string, anchorDay: number, index: number, reserved: Set<string>): string {
  const month = anchor.slice(0, 7);
  const open: string[] = [];
  for (let day = 1; day <= anchorDay; day += 1) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    if (!reserved.has(date)) open.push(date);
  }
  if (open.length === 0) return anchor;
  return open[index % open.length];
}

function lines(
  id: string,
  date: string,
  type: StoredRow["type"],
  notes: string,
  items: [string, string, string, string][],
): StoredRow[] {
  return items.map(([amount, category, l2, item]) =>
    blank({
      transaction_id: id,
      date,
      type,
      amount,
      category_l1: category,
      category_l2: l2,
      item_name: item,
      notes,
    }),
  );
}

function blank(partial: Pick<StoredRow, "transaction_id" | "date" | "type" | "amount" | "category_l1"> & Partial<StoredRow>): StoredRow {
  return {
    transaction_id: partial.transaction_id,
    date: partial.date,
    type: partial.type,
    amount: partial.amount,
    category_l1: partial.category_l1,
    category_l2: partial.category_l2 ?? "",
    item_name: partial.item_name ?? "",
    notes: partial.notes ?? "",
    wallet_id: partial.wallet_id ?? "Main Cash",
    beneficiary: partial.beneficiary ?? "Self",
  };
}

function splitTotal(total: number, parts: number, rand: () => number): number[] {
  if (parts <= 1) return [total];
  const weights = Array.from({ length: parts }, () => rand() + 0.35);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const amounts = weights.map((weight) => Math.round((weight / weightSum) * total));
  amounts[parts - 1] = total - amounts.slice(0, -1).reduce((sum, amount) => sum + amount, 0);
  if (amounts.some((amount) => amount <= 0)) {
    const base = Math.floor(total / parts);
    const even = Array<number>(parts).fill(base);
    even[parts - 1] += total - base * parts;
    return even;
  }
  return amounts;
}

function shiftMonthStart(anchor: string, delta: number): string {
  const [year, month] = anchor.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return date.toISOString().slice(0, 10);
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
