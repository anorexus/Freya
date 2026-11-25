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
    { l2: "Cafe", items: ["Filter coffee", "Butter croissant", "Iced latte"] },
    { l2: "Restaurant", items: ["Nasi goreng", "Soto", "Bakso", "Padang rice"] },
  ],
  Housing: [{ l2: "Rent", items: ["Monthly rent"] }],
  Utilities: [
    { l2: "Electric", items: ["PLN bill"] },
    { l2: "Internet", items: ["Home internet"] },
    { l2: "Phone", items: ["Mobile data"] },
  ],
  Health: [
    { l2: "Pharmacy", items: ["Vitamin C", "Paracetamol"] },
    { l2: "Clinic", items: ["Clinic visit"] },
  ],
  Shopping: [
    { l2: "Clothes", items: ["Cotton shirt", "Socks"] },
    { l2: "Home", items: ["Dish soap", "Tissue pack"] },
  ],
};

const EXTRA_CATEGORIES = ["Groceries", "Transport", "Food", "Utilities", "Health", "Shopping"] as const;

const COFFEE_NAMES = ["Filter coffee", "Iced latte", "Espresso", "Cold brew", "Cappuccino"] as const;

const MIN_AMOUNT = 20_000;

/**
 * Deterministic sample ledger covering a full year ending on the anchor day.
 * Every day has at least one expense (coffee), amounts stay ≥ 20k, and salary lands on the 25th.
 */
export function buildSeed(anchor: string): StoredRow[] {
  const rand = mulberry32(hashSeed(anchor));
  const start = addDays(anchor, -364);
  const rows: StoredRow[] = [];
  let dayIndex = 0;

  for (let date = start; date <= anchor; date = addDays(date, 1)) {
    const day = Number(date.slice(8, 10));
    const month = date.slice(0, 7);

    if (day === 25) {
      const salary = pickSalary(month, rand);
      rows.push(
        blank({
          transaction_id: `seed-salary-${month}`,
          date,
          type: "INCOME",
          amount: String(salary),
          category_l1: "Salary",
          notes: formatMonth(date),
        }),
      );
    }

    if (day === 1) {
      rows.push(
        blank({
          transaction_id: `seed-rent-${month}`,
          date,
          type: "EXPENSE",
          amount: String(jitter(4_500_000, 0.04, rand)),
          category_l1: "Housing",
          category_l2: "Rent",
          item_name: "Monthly rent",
          notes: formatMonth(date),
        }),
      );
    }

    // Coffee every day — guarantees ≥ 1 expense transaction.
    const coffeeAmount = roundToThousand(MIN_AMOUNT + Math.floor(rand() * 35_000));
    const coffeeName = COFFEE_NAMES[Math.floor(rand() * COFFEE_NAMES.length)];
    rows.push(
      blank({
        transaction_id: `seed-coffee-${date}`,
        date,
        type: "EXPENSE",
        amount: String(coffeeAmount),
        category_l1: "Food",
        category_l2: "Cafe",
        item_name: coffeeName,
        notes: "Coffee",
      }),
    );

    // Extra receipts: 0–3 more so the day has 1–4 expense transactions total.
    const extraCount = weightedCount(rand);
    for (let i = 0; i < extraCount; i += 1) {
      const category = EXTRA_CATEGORIES[Math.floor(rand() * EXTRA_CATEGORIES.length)];
      const group = CATALOG[category][Math.floor(rand() * CATALOG[category].length)];
      const item = group.items[Math.floor(rand() * group.items.length)];
      const amount = randomExpense(category, rand);
      const lineCount = rand() < 0.25 ? 2 + Math.floor(rand() * 2) : 1;
      const id = `seed-${date}-${i + 1}`;

      if (lineCount === 1) {
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
      } else {
        const parts = splitTotal(amount, lineCount, rand).map((part) => Math.max(MIN_AMOUNT, part));
        parts.forEach((part, lineIndex) => {
          const lineGroup = CATALOG[category][Math.floor(rand() * CATALOG[category].length)];
          const lineItem = lineGroup.items[Math.floor(rand() * lineGroup.items.length)];
          rows.push(
            blank({
              transaction_id: id,
              date,
              type: "EXPENSE",
              amount: String(part),
              category_l1: category,
              category_l2: lineGroup.l2,
              item_name: lineItem,
              notes: lineIndex === 0 ? "" : "",
            }),
          );
        });
      }
    }

    // Occasional utilities mid-month.
    if (day === 6 || day === 12) {
      const utilGroup = CATALOG.Utilities[day === 6 ? 1 : 0];
      rows.push(
        blank({
          transaction_id: `seed-util-${date}`,
          date,
          type: "EXPENSE",
          amount: String(jitter(day === 6 ? 389_000 : 450_000 + dayIndex * 137, 0.12, rand)),
          category_l1: "Utilities",
          category_l2: utilGroup.l2,
          item_name: utilGroup.items[0],
        }),
      );
    }

    dayIndex += 1;
  }

  // Keep newest activity near the top when browsing; stable sort by date then id.
  rows.sort((a, b) => (a.date === b.date ? a.transaction_id.localeCompare(b.transaction_id) : a.date.localeCompare(b.date)));
  return rows;
}

function pickSalary(month: string, rand: () => number): number {
  const monthNumber = Number(month.slice(5, 7));
  const base = monthNumber >= 7 ? 19_200_000 : 18_500_000;
  return jitter(base, 0.03, rand);
}

function randomExpense(category: string, rand: () => number): number {
  const ranges: Record<string, [number, number]> = {
    Groceries: [45_000, 420_000],
    Transport: [22_000, 185_000],
    Food: [35_000, 280_000],
    Utilities: [80_000, 640_000],
    Health: [25_000, 450_000],
    Shopping: [50_000, 1_600_000],
  };
  const [min, max] = ranges[category] ?? [MIN_AMOUNT, 200_000];
  const value = min + Math.floor(rand() * (max - min + 1));
  return Math.max(MIN_AMOUNT, roundToThousand(value));
}

/** 0 extras ~45%, 1 ~30%, 2 ~18%, 3 ~7% → daily expense receipts mostly 1–2, sometimes up to 4. */
function weightedCount(rand: () => number): number {
  const roll = rand();
  if (roll < 0.45) return 0;
  if (roll < 0.75) return 1;
  if (roll < 0.93) return 2;
  return 3;
}

function jitter(base: number, spread: number, rand: () => number): number {
  const factor = 1 + (rand() * 2 - 1) * spread;
  return Math.max(MIN_AMOUNT, roundToThousand(Math.round(base * factor)));
}

function roundToThousand(value: number): number {
  return Math.max(MIN_AMOUNT, Math.round(value / 1000) * 1000);
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
  if (amounts.some((amount) => amount < MIN_AMOUNT)) {
    const base = Math.floor(total / parts);
    const even = Array<number>(parts).fill(Math.max(MIN_AMOUNT, base));
    const used = even.slice(0, -1).reduce((sum, amount) => sum + amount, 0);
    even[parts - 1] = Math.max(MIN_AMOUNT, total - used);
    return even;
  }
  return amounts;
}

function hashSeed(anchor: string): number {
  let hash = 20261122;
  for (let i = 0; i < anchor.length; i += 1) {
    hash = (Math.imul(hash, 31) + anchor.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
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
