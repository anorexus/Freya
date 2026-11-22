import type { DayPoint, MonthPoint } from "../domain/aggregate";
import { formatAmount } from "../domain/money";

export function CashflowChart({ points }: { points: MonthPoint[] }) {
  const max = Math.max(1, ...points.flatMap((point) => [point.income, point.expense]));
  const label = points
    .map((point) => `${point.label}: income ${formatAmount(point.income)}, expense ${formatAmount(point.expense)}`)
    .join(". ");

  return (
    <div className="fy-chart" role="img" aria-label={`Income and expense by month. ${label}`}>
      {points.map((point) => (
        <div className="fy-chart-col" key={point.key}>
          <div className="fy-chart-bars">
            <span className="fy-bar fy-bar-income" style={{ height: barHeight(point.income, max) }} />
            <span className="fy-bar fy-bar-expense" style={{ height: barHeight(point.expense, max) }} />
          </div>
          <span className="fy-chart-label">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

export function WeekChart({ points }: { points: DayPoint[] }) {
  const max = Math.max(1, ...points.map((point) => point.amount));
  const total = points.reduce((sum, point) => sum + point.amount, 0);
  return (
    <div className="fy-week" role="img" aria-label={`Daily expense. Total ${formatAmount(total)}. ${points.map((point) => `${point.label}: ${formatAmount(point.amount)}`).join(", ")}.`}>
      {points.map((point) => (
        <div className={point.isToday ? "fy-week-col is-today" : "fy-week-col"} key={point.key}>
          <span className="fy-week-bar" style={{ height: barHeight(point.amount, max) }} />
          <span className="fy-chart-label">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function barHeight(value: number, max: number): string {
  if (value <= 0) return "0%";
  return `${Math.max(4, (value / max) * 100)}%`;
}
