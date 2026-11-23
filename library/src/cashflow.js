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

function on(today, monthOffset, day, type, amount, category = "") {
  const anchor = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  const limit = monthOffset === 0 ? today.getDate() : Math.min(today.getDate(), monthEnd);
  return {
    date: new Date(anchor.getFullYear(), anchor.getMonth(), Math.min(day, limit, monthEnd)),
    type,
    amount,
    category_l1: category,
  };
}

export function sampleTransactions(today = new Date()) {
  return [
    on(today, 0, 21, "INCOME", 18500000, "Salary"),
    on(today, 0, 2, "EXPENSE", 4500000, "Groceries"),
    on(today, 0, 5, "EXPENSE", 2200000, "Food"),
    on(today, 0, 8, "EXPENSE", 1500000, "Transport"),
    on(today, 0, 12, "EXPENSE", 1200000, "Housing"),
    on(today, 0, 18, "EXPENSE", 625000, "Utilities"),
    on(today, 0, 22, "EXPENSE", 381250, "Health"),
    on(today, -1, 21, "INCOME", 16500000),
    on(today, -1, 3, "EXPENSE", 2800000),
    on(today, -1, 9, "EXPENSE", 2400000),
    on(today, -1, 15, "EXPENSE", 2900000),
  ];
}
