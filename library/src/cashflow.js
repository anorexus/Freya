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

const ELECTRIC = [410000, 390000, 450000, 520000, 480000, 430000, 460000, 510000, 640000, 560000, 490000, 445000];

const STORY = [
  [0, 2, "EXPENSE", 420000, "Food"],
  [0, 8, "EXPENSE", 875000, "Groceries"],
  [0, 9, "EXPENSE", 180000, "Transport"],
  [0, 15, "EXPENSE", 265000, "Food"],
  [0, 16, "EXPENSE", 1250000, "Shopping"],
  [0, 18, "EXPENSE", 640000, "Groceries"],
  [0, 22, "EXPENSE", 95000, "Transport"],
  [0, 27, "EXPENSE", 185000, "Health"],
  [0, 28, "EXPENSE", 310000, "Food"],
  [1, 7, "EXPENSE", 920000, "Groceries"],
  [1, 8, "EXPENSE", 140000, "Transport"],
  [1, 14, "EXPENSE", 780000, "Food"],
  [1, 15, "EXPENSE", 450000, "Shopping"],
  [1, 18, "EXPENSE", 710000, "Groceries"],
  [1, 20, "EXPENSE", 210000, "Transport"],
  [1, 24, "EXPENSE", 95000, "Health"],
  [2, 5, "EXPENSE", 1100000, "Groceries"],
  [2, 8, "EXPENSE", 350000, "Transport"],
  [2, 11, "EXPENSE", 890000, "Shopping"],
  [2, 13, "EXPENSE", 240000, "Food"],
  [2, 16, "EXPENSE", 1750000, "Transport"],
  [2, 18, "INCOME", 9250000, "Other income"],
  [2, 19, "EXPENSE", 540000, "Groceries"],
  [2, 22, "EXPENSE", 190000, "Food"],
  [2, 28, "EXPENSE", 620000, "Transport"],
  [2, 29, "EXPENSE", 150000, "Health"],
  [3, 4, "EXPENSE", 760000, "Groceries"],
  [3, 6, "EXPENSE", 125000, "Transport"],
  [3, 9, "EXPENSE", 340000, "Food"],
  [3, 17, "EXPENSE", 690000, "Groceries"],
  [3, 18, "EXPENSE", 320000, "Shopping"],
  [3, 21, "EXPENSE", 88000, "Transport"],
  [3, 26, "EXPENSE", 275000, "Food"],
  [3, 27, "EXPENSE", 210000, "Health"],
  [4, 3, "EXPENSE", 840000, "Groceries"],
  [4, 8, "EXPENSE", 410000, "Food"],
  [4, 10, "EXPENSE", 260000, "Transport"],
  [4, 16, "EXPENSE", 1600000, "Shopping"],
  [4, 18, "EXPENSE", 730000, "Groceries"],
  [4, 23, "EXPENSE", 150000, "Transport"],
  [4, 24, "EXPENSE", 190000, "Food"],
  [4, 29, "EXPENSE", 120000, "Health"],
  [5, 5, "EXPENSE", 800000, "Groceries"],
  [5, 7, "EXPENSE", 175000, "Transport"],
  [5, 13, "EXPENSE", 520000, "Food"],
  [5, 14, "EXPENSE", 2750000, "Shopping"],
  [5, 19, "EXPENSE", 655000, "Groceries"],
  [5, 21, "EXPENSE", 98000, "Transport"],
  [5, 26, "EXPENSE", 230000, "Food"],
  [5, 28, "EXPENSE", 340000, "Health"],
  [6, 4, "EXPENSE", 910000, "Groceries"],
  [6, 6, "EXPENSE", 205000, "Transport"],
  [6, 11, "EXPENSE", 380000, "Food"],
  [6, 15, "EXPENSE", 1450000, "Health"],
  [6, 18, "EXPENSE", 700000, "Groceries"],
  [6, 20, "EXPENSE", 480000, "Shopping"],
  [6, 24, "EXPENSE", 160000, "Transport"],
  [6, 27, "EXPENSE", 295000, "Food"],
  [7, 2, "EXPENSE", 860000, "Groceries"],
  [7, 8, "EXPENSE", 190000, "Transport"],
  [7, 9, "EXPENSE", 610000, "Food"],
  [7, 14, "INCOME", 4000000, "Other income"],
  [7, 16, "EXPENSE", 540000, "Shopping"],
  [7, 17, "EXPENSE", 720000, "Transport"],
  [7, 20, "EXPENSE", 770000, "Groceries"],
  [7, 22, "EXPENSE", 255000, "Food"],
  [7, 29, "EXPENSE", 175000, "Health"],
  [8, 5, "EXPENSE", 980000, "Groceries"],
  [8, 6, "EXPENSE", 145000, "Transport"],
  [8, 12, "EXPENSE", 430000, "Food"],
  [8, 13, "EXPENSE", 390000, "Shopping"],
  [8, 19, "EXPENSE", 720000, "Groceries"],
  [8, 20, "EXPENSE", 110000, "Transport"],
  [8, 25, "EXPENSE", 200000, "Food"],
  [8, 27, "EXPENSE", 260000, "Health"],
  [9, 3, "EXPENSE", 890000, "Groceries"],
  [9, 7, "EXPENSE", 230000, "Transport"],
  [9, 10, "EXPENSE", 750000, "Food"],
  [9, 11, "EXPENSE", 1680000, "Shopping"],
  [9, 17, "EXPENSE", 810000, "Groceries"],
  [9, 18, "EXPENSE", 135000, "Transport"],
  [9, 24, "EXPENSE", 145000, "Health"],
  [9, 26, "EXPENSE", 280000, "Food"],
  [10, 2, "EXPENSE", 940000, "Groceries"],
  [10, 5, "EXPENSE", 165000, "Transport"],
  [10, 8, "EXPENSE", 360000, "Food"],
  [10, 9, "EXPENSE", 275000, "Shopping"],
  [10, 11, "INCOME", 2750000, "Other income"],
  [10, 14, "EXPENSE", 680000, "Groceries"],
  [10, 15, "EXPENSE", 120000, "Transport"],
  [10, 18, "EXPENSE", 510000, "Food"],
  [10, 21, "EXPENSE", 220000, "Health"],
  [10, 23, "EXPENSE", 85000, "Transport"],
];

export function sampleTransactions(today = new Date()) {
  const end = startOfDay(today);
  const year = end.getFullYear();
  const rows = [];
  const push = (month, day, type, amount, category) => {
    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date > end) return;
    rows.push({ date, type, amount, category_l1: category });
  };

  for (let month = 0; month <= end.getMonth(); month += 1) {
    push(month, 25, "INCOME", month >= 6 ? 19200000 : 18500000, "Salary");
    push(month, 1, "EXPENSE", 4500000, "Housing");
    push(month, 3, "EXPENSE", 389000, "Utilities");
    push(month, 6, "EXPENSE", 125000, "Utilities");
    push(month, 12, "EXPENSE", ELECTRIC[month], "Utilities");
  }

  for (const [month, day, type, amount, category] of STORY) push(month, day, type, amount, category);

  return rows.sort((a, b) => a.date - b.date);
}
