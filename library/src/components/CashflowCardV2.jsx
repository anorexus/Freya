import { useLayoutEffect, useRef, useState } from "react";
import { Button, buttonIcons } from "./Button.jsx";
import { ChartTip } from "./ChartTip.jsx";
import { CopyAmount } from "./CopyAmount.jsx";
import { Pill } from "./Pill.jsx";
import { formatRupiah } from "../money.js";
import { earliestTrendDate, expenseTrend, monthsBefore, trendChange } from "../trend.js";
import "./CashflowCardV2.css";

const WINDOW = 6;
const SLOT = 76;
const PLOT = 220;
const MIN_BAR = 48;

function windowSpan(width) {
  if (!width) return WINDOW;
  return Math.min(12, Math.max(WINDOW, Math.floor(width / SLOT)));
}

function previousMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1).toLocaleDateString("en-GB", { month: "short" });
}

function rangeLabel(points) {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return "";
  return `${first.weekday} ${first.day} - ${last.weekday} ${last.day}`;
}

function compactCash(amount) {
  const sign = amount < 0 ? "-" : "";
  const value = Math.abs(amount);
  if (value >= 1000000) {
    const millions = value / 1000000;
    const body = millions >= 100 ? String(Math.round(millions)) : millions.toFixed(1).replace(".", ",");
    return `${sign}Rp${body}M`;
  }
  if (value >= 1000) {
    const [whole, frac] = (value / 1000).toFixed(1).split(".");
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${sign}Rp${grouped},${frac}K`;
  }
  return formatRupiah(amount);
}

function changeRatio(current, previous) {
  if (previous == null || previous === 0) return null;
  return (current - previous) / previous;
}

function TrendPill({ change }) {
  if (change == null) return <Pill>—</Pill>;
  const rose = change > 0;
  return (
    <Pill tone={rose ? "positive" : "negative"}>
      <span className="pill-arrow" dangerouslySetInnerHTML={{ __html: rose ? buttonIcons.trendUp : buttonIcons.trendDown }} />
      {`${Math.abs(change * 100).toFixed(2)}%`}
    </Pill>
  );
}

function Column({ point, active, incomeHeight, expenseHeight, onSelect }) {
  const stack = Math.max(incomeHeight, expenseHeight + 2);
  return (
    <button type="button" role="option" aria-selected={active} className={active ? "cf2-col is-on" : "cf2-col"} onClick={onSelect}>
      <span className="cf2-overlay">
        {active ? (
          <ChartTip amount={point.amount} tone="signed">
            {compactCash(point.amount)}
          </ChartTip>
        ) : null}
        <span className="cf2-stack" style={{ height: stack }}>
          <span className="cf2-income" style={{ height: incomeHeight }} />
          <span className="cf2-expense" style={{ height: expenseHeight }}>
            <span className="cf2-month">{point.weekday}</span>
          </span>
        </span>
        <span className="cf2-year">{point.day}</span>
      </span>
    </button>
  );
}

export function CashflowCardV2({ transactions, today = new Date() }) {
  const chartRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);

  useLayoutEffect(() => {
    const node = chartRef.current;
    if (!node) return undefined;
    const measure = () => setChartWidth(node.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const span = windowSpan(chartWidth);
  const earliest = earliestTrendDate(transactions, "cashflow");
  const history = earliest ? monthsBefore(earliest, today) : 0;
  const maxPage = Math.max(0, history - (span - 1));
  const safePage = Math.min(page, maxPage);
  const summary = expenseTrend(transactions, "month", today, safePage, span, "cashflow");
  const previous = expenseTrend(transactions, "month", today, safePage + span, span, "cashflow");
  const overall = changeRatio(summary.total, previous.total);
  const selected = summary.points.find((point) => point.date.getTime() === selectedTime) ?? summary.points.at(-1);
  const priorMonth = expenseTrend(transactions, "month", today, safePage + 1, 1, "cashflow").points[0];
  const priorAmount = priorMonth ? priorMonth.amount : null;
  const change = selected
    ? trendChange(summary.points, selected.date) ?? changeRatio(selected.amount, selected.date.getTime() === summary.points[0]?.date.getTime() ? priorAmount : null)
    : null;
  const max = Math.max(...summary.points.map((point) => Math.max(point.income || 0, point.expense || 0)), 1);

  return (
    <article className="cf2">
      <header className="cf2-head">
        <h2>Cashflow trend</h2>
      </header>
      <div className="cf2-shell">
        <div className="cf2-panel">
          <div className="cf2-summary">
            <p>Average cashflow • {rangeLabel(summary.points)}</p>
            <div className="cf2-amount">
              <p className="cf2-value">
                <CopyAmount>{formatRupiah(summary.average)}</CopyAmount>
              </p>
              <TrendPill change={overall} />
            </div>
          </div>
          <div className="cf2-chart" ref={chartRef} role="listbox" aria-label="Cashflow">
            {summary.points.map((point) => {
              const income = point.income || 0;
              const expense = point.expense || 0;
              return (
                <Column
                  key={point.date.getTime()}
                  point={point}
                  active={selected && point.date.getTime() === selected.date.getTime()}
                  incomeHeight={Math.max(MIN_BAR, (income / max) * PLOT)}
                  expenseHeight={Math.max(MIN_BAR, (expense / max) * PLOT)}
                  onSelect={() => setSelectedTime(point.date.getTime())}
                />
              );
            })}
          </div>
          <div className="cf2-page">
            <Button
              variant="navigation"
              icon={buttonIcons.arrowLeft}
              aria-label="Earlier months"
              disabled={safePage >= maxPage}
              onClick={() => {
                setPage((current) => Math.min(maxPage, current + 1));
                setSelectedTime(null);
              }}
            />
            <Button
              variant="navigation"
              icon={buttonIcons.arrowRight}
              aria-label="Later months"
              disabled={safePage === 0}
              onClick={() => {
                setPage((current) => Math.max(0, current - 1));
                setSelectedTime(null);
              }}
            />
          </div>
        </div>
        <footer className="cf2-foot">
          <TrendPill change={change} />
          <p className="cf2-note">
            {selected ? `Compare to ${previousMonth(selected.date)}, cashflow in ${selected.weekday}` : "Cashflow"}
            <span>
              <CopyAmount>{compactCash(selected ? selected.amount : 0)}</CopyAmount>
            </span>
          </p>
        </footer>
      </div>
    </article>
  );
}
