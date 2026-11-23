const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK_WINDOW = 7;
const MONTH_WINDOW = 7;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, amount) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function weekStart(date) {
  const day = startOfDay(date);
  const delta = day.getDay() === 0 ? 6 : day.getDay() - 1;
  return addDays(day, -delta);
}

function expenseByDay(transactions, start, end) {
  const totals = new Map();
  const first = startOfDay(start).getTime();
  const last = startOfDay(end).getTime();
  for (const transaction of transactions) {
    if (transaction.type !== "EXPENSE") continue;
    const day = startOfDay(transaction.date).getTime();
    if (day < first || day > last) continue;
    totals.set(day, (totals.get(day) || 0) + transaction.amount);
  }
  return totals;
}

function monthPoint(transactions, monthDate, today) {
  const end = startOfDay(today);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const capped = monthDate.getFullYear() === end.getFullYear() && monthDate.getMonth() === end.getMonth() ? end : monthEnd;
  const totals = expenseByDay(transactions, monthDate, capped);
  let amount = 0;
  for (const value of totals.values()) amount += value;
  return {
    date: monthDate,
    weekday: MONTHS[monthDate.getMonth()],
    day: monthDate.getFullYear(),
    amount,
  };
}

export function expenseTrend(transactions, range, today = new Date(), page = 0, count) {
  const anchor = startOfDay(today);
  const monthly = range === "month";
  const size = Math.max(1, count || (monthly ? MONTH_WINDOW : WEEK_WINDOW));
  const points = [];
  if (monthly) {
    const endMonth = new Date(anchor.getFullYear(), anchor.getMonth() - page, 1);
    const start = new Date(endMonth.getFullYear(), endMonth.getMonth() - (size - 1), 1);
    for (let index = 0; index < size; index += 1) {
      points.push(monthPoint(transactions, new Date(start.getFullYear(), start.getMonth() + index, 1), anchor));
    }
  } else {
    const end = addDays(anchor, -page);
    const start = addDays(end, -(size - 1));
    const totals = expenseByDay(transactions, start, end);
    for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
      points.push({
        date: cursor,
        weekday: WEEKDAYS[cursor.getDay()],
        day: cursor.getDate(),
        amount: totals.get(cursor.getTime()) || 0,
      });
    }
  }
  const total = points.reduce((sum, point) => sum + point.amount, 0);
  const peak = points.reduce((best, point) => (point.amount > best.amount ? point : best), points[0]);
  return {
    points,
    total,
    average: points.length === 0 ? 0 : total / points.length,
    peakKey: peak ? peak.date.getTime() : null,
  };
}

export function trendChange(points, selected) {
  const index = points.findIndex((point) => point.date.getTime() === selected.getTime());
  if (index <= 0) return null;
  const previous = points[index - 1].amount;
  if (previous === 0) return null;
  return (points[index].amount - previous) / previous;
}

export function formatCompactRupiah(amount) {
  if (amount >= 1000000) {
    const millions = amount / 1000000;
    const body = millions >= 10 ? String(Math.round(millions)) : millions.toFixed(1).replace(/\.0$/, "");
    return `Rp${body}M`;
  }
  return `Rp${Math.round(amount / 1000)}K`;
}
