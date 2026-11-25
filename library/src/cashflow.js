function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDateLastMonth(today) {
  const day = today.getDate();
  const lastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  return new Date(today.getFullYear(), today.getMonth() - 1, Math.min(day, lastDay));
}

function inWindow(date, start, end) {
  const day = startOfDay(date).getTime();
  return day >= startOfDay(start).getTime() && day <= startOfDay(end).getTime();
}

function sumWindow(transactions, start, end) {
  return transactions.reduce(
    (totals, transaction) => {
      if (!inWindow(transaction.date, start, end)) return totals;
      if (transaction.type === "INCOME") totals.income += transaction.amount;
      if (transaction.type === "EXPENSE") totals.expense += transaction.amount;
      return totals;
    },
    { income: 0, expense: 0 },
  );
}

/**
 * Net cashflow is income minus expense. Transfers are ignored.
 * Both windows run from the 1st through the same day of the month.
 * Average spending is expense so far divided by the days elapsed, including today.
 */
export function cashflowSummary(transactions, today = new Date()) {
  const currentEnd = startOfDay(today);
  const currentStart = new Date(currentEnd.getFullYear(), currentEnd.getMonth(), 1);
  const previousEnd = sameDateLastMonth(currentEnd);
  const previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth(), 1);

  const current = sumWindow(transactions, currentStart, currentEnd);
  const previous = sumWindow(transactions, previousStart, previousEnd);
  const net = current.income - current.expense;
  const previousNet = previous.income - previous.expense;
  const daysElapsed = currentEnd.getDate();
  const flow = current.income + current.expense;

  return {
    income: current.income,
    expense: current.expense,
    net,
    daysElapsed,
    averageSpend: daysElapsed === 0 ? 0 : current.expense / daysElapsed,
    incomeShare: flow === 0 ? 0 : current.income / flow,
    trend: previousNet === 0 ? null : (net - previousNet) / Math.abs(previousNet),
  };
}

export function formatTrend(ratio) {
  if (ratio == null) return "—";
  const percent = Math.round(ratio * 100);
  if (percent > 0) return `+${percent}%`;
  return `${percent}%`;
}

const MIN_AMOUNT = 20_000;
const EXTRA_CATEGORIES = ["Groceries", "Transport", "Food", "Utilities", "Health", "Shopping"];
const EXPENSE_RANGES = {
  Groceries: [45_000, 420_000],
  Transport: [22_000, 185_000],
  Food: [35_000, 280_000],
  Utilities: [80_000, 640_000],
  Health: [25_000, 450_000],
  Shopping: [50_000, 1_600_000],
};

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundToThousand(value) {
  return Math.max(MIN_AMOUNT, Math.round(value / 1000) * 1000);
}

function jitter(base, spread, rand) {
  return roundToThousand(Math.round(base * (1 + (rand() * 2 - 1) * spread)));
}

function randomExpense(category, rand) {
  const [min, max] = EXPENSE_RANGES[category] ?? [MIN_AMOUNT, 200_000];
  return roundToThousand(min + Math.floor(rand() * (max - min + 1)));
}

function weightedExtras(rand) {
  const roll = rand();
  if (roll < 0.45) return 0;
  if (roll < 0.75) return 1;
  if (roll < 0.93) return 2;
  return 3;
}

/**
 * Full-year sample ledger ending on `today`.
 * Coffee every day, salary on the 25th, ≥1 expense/day, amounts ≥ 20k.
 */
export function sampleTransactions(today = new Date()) {
  const end = startOfDay(today);
  const start = new Date(end);
  start.setDate(start.getDate() - 364);
  const rand = mulberry32(end.getFullYear() * 10000 + (end.getMonth() + 1) * 100 + end.getDate());
  const rows = [];

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = startOfDay(cursor);
    const day = date.getDate();
    const month = date.getMonth();

    if (day === 25) {
      rows.push({
        date: new Date(date),
        type: "INCOME",
        amount: jitter(month >= 6 ? 19_200_000 : 18_500_000, 0.03, rand),
        category_l1: "Salary",
      });
    }

    if (day === 1) {
      rows.push({
        date: new Date(date),
        type: "EXPENSE",
        amount: jitter(4_500_000, 0.04, rand),
        category_l1: "Housing",
      });
    }

    rows.push({
      date: new Date(date),
      type: "EXPENSE",
      amount: roundToThousand(MIN_AMOUNT + Math.floor(rand() * 35_000)),
      category_l1: "Food",
    });

    const extras = weightedExtras(rand);
    for (let i = 0; i < extras; i += 1) {
      const category = EXTRA_CATEGORIES[Math.floor(rand() * EXTRA_CATEGORIES.length)];
      rows.push({
        date: new Date(date),
        type: "EXPENSE",
        amount: randomExpense(category, rand),
        category_l1: category,
      });
    }

    if (day === 6 || day === 12) {
      rows.push({
        date: new Date(date),
        type: "EXPENSE",
        amount: jitter(day === 6 ? 389_000 : 480_000, 0.12, rand),
        category_l1: "Utilities",
      });
    }
  }

  return rows.sort((a, b) => a.date - b.date);
}
