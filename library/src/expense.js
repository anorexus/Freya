function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function inMonthToDate(date, today) {
  const day = startOfDay(date).getTime();
  const end = startOfDay(today).getTime();
  const start = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  return day >= start && day <= end;
}

export function expenseBreakdown(transactions, categories, today = new Date()) {
  const colors = new Map(
    categories.filter((category) => category.type === "EXPENSE").map((category) => [category.l1, category.color]),
  );
  const totals = new Map();

  for (const transaction of transactions) {
    if (transaction.type !== "EXPENSE" || !inMonthToDate(transaction.date, today)) continue;
    const name = transaction.category_l1 || "Other";
    totals.set(name, (totals.get(name) || 0) + transaction.amount);
  }

  const slices = [...totals.entries()]
    .map(([name, amount]) => ({
      name,
      amount,
      color: colors.get(name) || "#9e9e9e",
    }))
    .sort((a, b) => b.amount - a.amount);

  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  const top = slices[0] ?? null;

  return {
    total,
    slices,
    top,
    topShare: top && total > 0 ? top.amount / total : 0,
  };
}

export function formatShare(share) {
  return `${(share * 100).toFixed(1)}%`;
}
