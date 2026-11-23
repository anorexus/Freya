import { useLayoutEffect, useRef, useState } from "react";
import { Button, buttonIcons } from "./Button.jsx";
import { formatTrend } from "../cashflow.js";
import { formatRupiah } from "../money.js";
import { expenseTrend, formatCompactRupiah, trendChange } from "../trend.js";
import "./LiquidityCard.css";
import "./CashflowCard.css";
import "./TrendCard.css";

const RANGES = [
  ["week", "Weekly"],
  ["month", "Monthly"],
];
const COLUMN = 56;
const COLUMN_GAP = 8;

function pageLabel(points, monthly) {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return "";
  if (monthly) return `${first.weekday} ${first.day} – ${last.weekday} ${last.day}`;
  const side = (point, withComma) => {
    const month = point.date.toLocaleDateString("en-GB", { month: "short" });
    return withComma ? `${point.weekday}, ${point.day} ${month}` : `${point.weekday} ${point.day} ${month}`;
  };
  return `${side(first, true)} - ${side(last, false)}`;
}

export function TrendCard({ transactions, today = new Date() }) {
  const [range, setRange] = useState("week");
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(7);
  const [open, setOpen] = useState(false);
  const rowRef = useRef(null);
  const summary = expenseTrend(transactions, range, today, page, count);
  const [selectedTime, setSelectedTime] = useState(null);
  const selected = summary.points.find((point) => point.date.getTime() === selectedTime) ?? summary.points.at(-1);
  const change = selected ? trendChange(summary.points, selected.date) : null;
  const spendingRose = change > 0;
  const max = Math.max(...summary.points.map((point) => point.amount), 1);
  const monthly = range === "month";

  useLayoutEffect(() => {
    const node = rowRef.current;
    if (!node) return undefined;
    const measure = () => {
      const minimum = 7;
      const fit = Math.max(1, Math.floor((node.clientWidth + COLUMN_GAP) / (COLUMN + COLUMN_GAP)));
      const next = Math.max(minimum, fit);
      setCount((current) => (current === next ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <article className="liq-card is-chart">
      <header className="liq-card-head trend-head">
        <h2>Expense trend</h2>
        <div className="fy-drop">
          <Button variant="dropdown" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
            {RANGES.find(([id]) => id === range)[1]}
          </Button>
          {open ? (
            <ul className="fy-drop-list" role="listbox">
              {RANGES.map(([id, label]) => (
                <li key={id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={id === range}
                    onClick={() => {
                      setRange(id);
                      setPage(0);
                      setOpen(false);
                      setSelectedTime(null);
                    }}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>
      <div className="liq-card-body">
        <div className="trend-body">
          <div className="trend-summary">
            <p className="trend-label">Average spending</p>
            <p className="trend-value">{formatRupiah(summary.average)}</p>
          </div>
          <div className={monthly ? "trend-row is-month" : "trend-row"} ref={rowRef} role="listbox" aria-label={monthly ? "Spending by month" : "Spending by day"}>
            {summary.points.map((point) => {
              const active = selected && point.date.getTime() === selected.date.getTime();
              return (
                <button
                  key={point.date.getTime()}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={active ? "trend-col is-selected" : "trend-col"}
                  onClick={() => setSelectedTime(point.date.getTime())}
                >
                  <span className="trend-spacer" style={{ flexGrow: 1 - point.amount / max }} />
                  <span className="trend-mark">
                    <span className={active ? "trend-tip" : "trend-tip is-off"} aria-hidden={active ? undefined : true}>{formatCompactRupiah(point.amount)}</span>
                    <span className={active ? "trend-cap is-off" : "trend-cap"} aria-hidden={active ? true : undefined} />
                  </span>
                  <span className={active ? "trend-lower is-on" : "trend-lower"} style={{ flexGrow: point.amount / max }}>
                    <span className="trend-stem" />
                    <span className="trend-day">{point.weekday}</span>
                    <span className="trend-date">{point.day}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="trend-page">
            <span className="trend-page-prev">
              <Button
                variant="navigation"
                icon={buttonIcons.expand}
                aria-label={monthly ? "Previous month" : "Previous day"}
                onClick={() => setPage((current) => current + 1)}
              />
            </span>
            <p className="trend-page-label">{pageLabel(summary.points, monthly)}</p>
            <Button
              variant="navigation"
              icon={buttonIcons.expand}
              aria-label={monthly ? "Next month" : "Next day"}
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            />
          </div>
        </div>
        <footer className="liq-foot">
          {change == null ? (
            <span className="liq-pill">—</span>
          ) : (
            <span className={`liq-pill is-${spendingRose ? "negative" : "positive"}`}>
              <svg className={spendingRose ? "trend-arrow" : "trend-arrow is-down"} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 12.5L6.2 8L8.5 10.4L13 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {formatTrend(Math.abs(change)).replace("+", "")}
            </span>
          )}
          <p className="cf-note">
            {selected ? `Spending ${monthly ? "in" : "on"} ${selected.weekday}` : "Spending"}
            <span className="cf-avg">{selected ? formatRupiah(selected.amount) : formatRupiah(0)}</span>
          </p>
        </footer>
      </div>
    </article>
  );
}
