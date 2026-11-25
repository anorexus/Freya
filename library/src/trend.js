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

function signedAmount(transaction, kind) {
  if (kind === "cashflow") {
    if (transaction.type === "TRANSFER") return 0;
    return transaction.type === "EXPENSE" ? -transaction.amount : transaction.amount;
  }
  return transaction.type === "EXPENSE" ? transaction.amount : 0;
}

function totalsByDay(transactions, start, end, kind) {
  const totals = new Map();
  const income = new Map();
  const expense = new Map();
  const first = startOfDay(start).getTime();
  const last = startOfDay(end).getTime();
  for (const transaction of transactions) {
    if (transaction.type === "TRANSFER") continue;
    const day = startOfDay(transaction.date).getTime();
    if (day < first || day > last) continue;
    if (kind === "cashflow") {
      if (transaction.type === "INCOME") income.set(day, (income.get(day) || 0) + transaction.amount);
      if (transaction.type === "EXPENSE") expense.set(day, (expense.get(day) || 0) + transaction.amount);
      continue;
    }
    const amount = signedAmount(transaction, kind);
    if (amount === 0) continue;
    totals.set(day, (totals.get(day) || 0) + amount);
  }
  return { totals, income, expense };
}

function pointFromMaps(date, weekday, day, maps, kind) {
  const key = startOfDay(date).getTime();
  if (kind === "cashflow") {
    const income = maps.income.get(key) || 0;
    const expense = maps.expense.get(key) || 0;
    return { date, weekday, day, income, expense, amount: income - expense };
  }
  return { date, weekday, day, amount: maps.totals.get(key) || 0 };
}

function monthPoint(transactions, monthDate, today, kind) {
  const end = startOfDay(today);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const capped = monthDate.getFullYear() === end.getFullYear() && monthDate.getMonth() === end.getMonth() ? end : monthEnd;
  const maps = totalsByDay(transactions, monthDate, capped, kind);
  if (kind === "cashflow") {
    let income = 0;
    let expense = 0;
    for (const value of maps.income.values()) income += value;
    for (const value of maps.expense.values()) expense += value;
    return {
      date: monthDate,
      weekday: MONTHS[monthDate.getMonth()],
      day: monthDate.getFullYear(),
      income,
      expense,
      amount: income - expense,
    };
  }
  let amount = 0;
  for (const value of maps.totals.values()) amount += value;
  return {
    date: monthDate,
    weekday: MONTHS[monthDate.getMonth()],
    day: monthDate.getFullYear(),
    amount,
  };
}

export function expenseTrend(transactions, range, today = new Date(), page = 0, count, kind = "expense") {
  const anchor = startOfDay(today);
  const monthly = range === "month";
  const size = Math.max(1, count || (monthly ? MONTH_WINDOW : WEEK_WINDOW));
  const points = [];
  if (monthly) {
    const endMonth = new Date(anchor.getFullYear(), anchor.getMonth() - page, 1);
    const start = new Date(endMonth.getFullYear(), endMonth.getMonth() - (size - 1), 1);
    for (let index = 0; index < size; index += 1) {
      points.push(monthPoint(transactions, new Date(start.getFullYear(), start.getMonth() + index, 1), anchor, kind));
    }
  } else {
    const end = addDays(anchor, -page);
    const start = addDays(end, -(size - 1));
    const maps = totalsByDay(transactions, start, end, kind);
    for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
      points.push(pointFromMaps(cursor, WEEKDAYS[cursor.getDay()], cursor.getDate(), maps, kind));
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
  const sign = amount < 0 ? "-" : "";
  const value = Math.abs(amount);
  if (value >= 1000000) {
    const millions = value / 1000000;
    const body = millions >= 10 ? String(Math.round(millions)) : millions.toFixed(1).replace(/\.0$/, "");
    return `${sign}Rp${body}M`;
  }
  return `${sign}Rp${Math.round(value / 1000)}K`;
}
