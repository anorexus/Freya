const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function utcDay(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Default period is day 1 through the last day of the current month.
 * A later startDay is a payday cycle: the 25th runs through the 24th.
 */
export function liquidityPeriod(today = new Date(), startDay = 1) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const dim = daysInMonth(year, month);
  const start = Math.min(Math.max(1, startDay), dim);
  const todayDate = new Date(year, month, today.getDate());

  let startDate;
  let endDate;

  if (start === 1) {
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month, dim);
  } else if (todayDate.getDate() >= start) {
    startDate = new Date(year, month, start);
    const nextMonth = month + 1;
    const nextDim = daysInMonth(year, nextMonth);
    endDate = new Date(year, nextMonth, Math.min(start - 1, nextDim));
  } else {
    const prevMonth = month - 1;
    const prevDim = daysInMonth(year, prevMonth);
    startDate = new Date(year, prevMonth, Math.min(start, prevDim));
    endDate = new Date(year, month, Math.min(start - 1, dim));
  }

  const totalDays = Math.round((utcDay(endDate) - utcDay(startDate)) / 86400000) + 1;
  const daysLeft = Math.max(0, Math.round((utcDay(endDate) - utcDay(todayDate)) / 86400000));
  const elapsedDays = Math.min(totalDays, totalDays - daysLeft);

  return { startDate, endDate, totalDays, daysLeft, elapsedDays, calendarMonth: start === 1 };
}

export function formatDay(date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}
