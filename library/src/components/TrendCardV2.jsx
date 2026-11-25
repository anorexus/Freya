import { useRef, useState } from "react";
import { Button, buttonIcons, useDismiss } from "./Button.jsx";
import { CopyAmount } from "./CopyAmount.jsx";
import { formatTrend } from "../cashflow.js";
import { formatRupiah } from "../money.js";
import { expenseTrend, formatCompactRupiah, trendChange } from "../trend.js";
import { Pill } from "./Pill.jsx";
import "./LiquidityCard.css";
import "./TrendCardV2.css";

const RANGES = [
  ["week", "Daily"],
  ["month", "Monthly"],
];
const WINDOW = 7;

function pageLabel(points, monthly) {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return "";
  const side = (point) => {
    const month = point.date.toLocaleDateString("en-GB", { month: "short" });
    return monthly ? `${point.weekday} ${point.day}` : `${point.weekday}, ${point.day} ${month}`;
  };
  return `${side(first)} - ${side(last)}`;
}

function ExpenseColumn({ point, active, ratio, minimum, onSelect }) {
  const bar = active ? (
    <>
      <span className="et-stem is-on" />
      <span className="et-day">{point.weekday}</span>
    </>
  ) : (
    <>
      <span className="et-stem" />
      <span className="et-weekday">{point.weekday}</span>
    </>
  );
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      className={active ? "et-col is-on is-spend" : "et-col"}
      onClick={onSelect}
    >
      {active ? (
        <>
          <span className="et-spacer" style={{ flexGrow: minimum ? 1 : 1 - ratio }} />
          <span
            className={minimum ? "et-wash is-min" : "et-wash"}
            style={minimum ? undefined : { flexGrow: ratio, flexBasis: 0 }}
          >
            <span className="et-tip">
              <CopyAmount>{formatCompactRupiah(point.amount)}</CopyAmount>
            </span>
            {bar}
            <span className="et-date">{point.day}</span>
          </span>
        </>
      ) : (
        <>
          <span className="et-spacer" style={{ flexGrow: minimum ? 1 : 1 - ratio }} />
          <span className={minimum ? "et-capsule is-min" : "et-capsule"} style={minimum ? undefined : { flexGrow: ratio }}>
            {bar}
          </span>
          <span className="et-date">{point.day}</span>
        </>
      )}
    </button>
  );
}

function shareHeight(value, max, floor, inset = 0) {
  const ratio = max > 0 ? value / max : 0;
  if (inset === 0) return `max(${floor}px, ${ratio * 100}%)`;
  return `max(${floor}px, calc(${ratio * 100}% - ${inset}px))`;
}

function peakLift(income, expense, max) {
  const incomeRatio = max > 0 ? income / max : 0;
  const expenseRatio = max > 0 ? expense / max : 0;
  const plot = "(100% - var(--et-below))";
  const incomeTop = `max(52px, ${incomeRatio} * ${plot})`;
  const expenseTop = `max(50px, ${expenseRatio} * ${plot} - 2px)`;
  return `calc(var(--et-below) + var(--et-peak-gap) + max(${incomeTop}, ${expenseTop}))`;
}

function CashflowColumn({ point, active, max, onSelect }) {
  const income = point.income || 0;
  const expense = point.expense || 0;
  const lift = active ? peakLift(income, expense, max) : null;
  const bars = (
    <span className="et-plot">
      <span className="et-flow-income" style={{ height: shareHeight(income, max, 52) }} />
      <span className="et-flow-expense" style={{ height: shareHeight(expense, max, 48, 4) }}>
        <span className="et-weekday">{point.weekday}</span>
      </span>
    </span>
  );
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      className={active ? "et-col is-on is-flow" : "et-col is-flow"}
      onClick={onSelect}
    >
      <span className="et-flow-stack">
        {active ? (
          <>
            <span className="et-wash" style={{ height: lift }} />
            <span className="et-tip" style={{ bottom: lift }}>
              <CopyAmount>{formatCompactRupiah(point.amount)}</CopyAmount>
            </span>
          </>
        ) : null}
        {bars}
        <span className="et-date">{point.day}</span>
      </span>
    </button>
  );
}

export function TrendCardV2({ transactions, today = new Date(), kind = "expense" }) {
  const cashflow = kind === "cashflow";
  const [range, setRange] = useState(cashflow ? "month" : "week");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const dropRef = useRef(null);
  useDismiss(open, dropRef, () => setOpen(false));

  const summary = expenseTrend(transactions, range, today, page, WINDOW, kind);
  const selected = summary.points.find((point) => point.date.getTime() === selectedTime) ?? summary.points.at(-1);
  const change = selected ? trendChange(summary.points, selected.date) : null;
  const rose = change > 0;
  const favorable = cashflow ? rose : !rose;
  const monthly = range === "month";
  const max = Math.max(
    ...summary.points.map((point) => (cashflow ? Math.max(point.income || 0, point.expense || 0) : Math.abs(point.amount))),
    1,
  );

  return (
    <article className="liq-card is-chart et-card">
      <header className="liq-card-head">
        <h2>{cashflow ? "Cashflow trend" : "Expense trend"}</h2>
        {cashflow ? null : (
          <div className="fy-drop" ref={dropRef}>
            <Button variant="dropdown" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
              {RANGES.find(([id]) => id === range)[1]}
            </Button>
            {open ? (
              <ul className="fy-wallet-menu" role="listbox">
                {RANGES.map(([id, label]) => (
                  <li key={id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={id === range}
                      onClick={() => {
                        setRange(id);
                        setPage(0);
                        setSelectedTime(null);
                        setOpen(false);
                      }}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </header>
      <div className="liq-card-body">
        <div className="et-panel">
          <div className="et-summary">
            <p>{cashflow ? "Average cashflow" : "Average spending"}</p>
            <p className="et-value">
              <CopyAmount>{formatRupiah(summary.average)}</CopyAmount>
            </p>
          </div>
          <div className="et-chart" role="listbox" aria-label={cashflow ? "Cashflow" : "Spending"}>
            {summary.points.map((point) => {
              const active = selected && point.date.getTime() === selected.date.getTime();
              const magnitude = cashflow ? Math.max(point.income || 0, point.expense || 0) : Math.abs(point.amount);
              const ratio = Math.max(magnitude / max, 0.22);
              const onSelect = () => setSelectedTime(point.date.getTime());
              return cashflow ? (
                <CashflowColumn key={point.date.getTime()} point={point} active={active} max={max} onSelect={onSelect} />
              ) : (
                <ExpenseColumn
                  key={point.date.getTime()}
                  point={point}
                  active={active}
                  ratio={ratio}
                  minimum={ratio <= 0.22}
                  onSelect={onSelect}
                />
              );
            })}
          </div>
          <div className="et-page">
            <Button
              variant="navigation"
              icon={buttonIcons.arrowLeft}
              aria-label={monthly ? "Previous month" : "Previous day"}
              onClick={() => setPage((current) => current + 1)}
            />
            <span className="et-rule" />
            <p>{pageLabel(summary.points, monthly)}</p>
            <span className="et-rule" />
            <Button
              variant="navigation"
              icon={buttonIcons.arrowRight}
              aria-label={monthly ? "Next month" : "Next day"}
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            />
          </div>
        </div>
        <footer className="liq-foot">
          {change == null ? (
            <Pill>—</Pill>
          ) : (
            <Pill tone={favorable ? "positive" : "negative"}>
              <span
                className="et-arrow"
                dangerouslySetInnerHTML={{
                  __html: (rose ? buttonIcons.trendUp : buttonIcons.trendDown).replaceAll(
                    rose ? "trend-up" : "trend-down",
                    `et-${kind}-${rose ? "up" : "down"}`,
                  ),
                }}
              />
              {formatTrend(Math.abs(change)).replace("+", "")}
            </Pill>
          )}
          <p className="et-note">
            {selected ? `${cashflow ? "Cashflow" : "Spending"} in ${selected.weekday}` : cashflow ? "Cashflow" : "Spending"}
            <span>
              <CopyAmount>
                {selected ? (cashflow ? formatCompactRupiah(selected.amount) : formatRupiah(selected.amount)) : formatRupiah(0)}
              </CopyAmount>
            </span>
          </p>
        </footer>
      </div>
    </article>
  );
}
