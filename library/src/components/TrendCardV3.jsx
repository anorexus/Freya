import { useRef, useState } from "react";
import { Button, buttonIcons, useDismiss } from "./Button.jsx";
import { ChartTip } from "./ChartTip.jsx";
import { CopyAmount } from "./CopyAmount.jsx";
import { Pill } from "./Pill.jsx";
import { StepTrack } from "./StepTrack.jsx";
import { formatRupiah } from "../money.js";
import { expenseTrend, formatCompactRupiah, trendChange } from "../trend.js";
import "./TrendCardV3.css";

const RANGES = [
  ["week", "Daily"],
  ["month", "Monthly"],
];
const WINDOW = 7;
const YEAR = 12;
const PLOT = 250;
const MIN_BAR = 56;
const STEM_FLOOR = 24;

function previousLabel(date, monthly) {
  const prior = monthly
    ? new Date(date.getFullYear(), date.getMonth() - 1, 1)
    : new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  return prior.toLocaleDateString("en-GB", monthly ? { month: "short" } : { weekday: "short" });
}

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

function compactLabel(amount) {
  if (Math.abs(amount) < 1000) return formatRupiah(amount);
  return formatCompactRupiah(amount).replace(".", ",");
}

function formatChange(ratio) {
  return `${Math.abs(ratio * 100).toFixed(2)}%`;
}

function dayOffset(today, end) {
  const anchor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((anchor - end) / 86400000);
}

function dailyEnds(today) {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lastDate = end.getDate();
  if (lastDate < WINDOW) return [end];
  const ends = [];
  for (let day = lastDate; day >= WINDOW; day -= 1) ends.push(new Date(end.getFullYear(), end.getMonth(), day));
  return ends;
}

function TrendPill({ change }) {
  if (change == null) return <Pill>—</Pill>;
  const rose = change > 0;
  return (
    <Pill tone={rose ? "negative" : "positive"}>
      <span className="pill-arrow" dangerouslySetInnerHTML={{ __html: rose ? buttonIcons.trendUp : buttonIcons.trendDown }} />
      {formatChange(change)}
    </Pill>
  );
}

function Column({ point, active, ratio, minimum, onSelect }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      className={active ? "st3-col is-on" : "st3-col"}
      onClick={onSelect}
    >
      <span className={minimum ? "st3-bar is-min" : "st3-bar"} style={minimum ? undefined : { height: `${ratio * 100}%` }}>
        {active ? (
          <ChartTip>{compactLabel(point.amount)}</ChartTip>
        ) : null}
        <span className="st3-capsule">
          {minimum ? null : <span className="st3-stem" />}
          <span className="st3-weekday">{point.weekday}</span>
        </span>
      </span>
      <span className="st3-date">{point.day}</span>
    </button>
  );
}

export function TrendCardV3({ transactions, today = new Date() }) {
  const [range, setRange] = useState("week");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const dropRef = useRef(null);
  useDismiss(open, dropRef, () => setOpen(false));

  const monthly = range === "month";
  const ends = monthly ? null : dailyEnds(today);
  const maxPage = monthly ? Math.max(0, YEAR - WINDOW) : ends.length - 1;
  const safePage = Math.min(page, maxPage);
  const dailyEnd = monthly ? null : ends[safePage];
  const dailyCount = dailyEnd && dailyEnd.getDate() < WINDOW ? dailyEnd.getDate() : WINDOW;
  const summary = expenseTrend(
    transactions,
    range,
    today,
    monthly ? safePage : dayOffset(today, dailyEnd),
    monthly ? WINDOW : dailyCount,
    "expense",
  );
  const previousEnd = monthly ? null : ends[safePage + WINDOW];
  const previous =
    monthly || (previousEnd && previousEnd.getMonth() === dailyEnd.getMonth() && previousEnd.getFullYear() === dailyEnd.getFullYear())
      ? expenseTrend(
          transactions,
          range,
          today,
          monthly ? safePage + WINDOW : dayOffset(today, previousEnd),
          WINDOW,
          "expense",
        )
      : { total: 0, points: [] };
  const overall = previous.total === 0 ? null : (summary.total - previous.total) / previous.total;
  const selected = summary.points.find((point) => point.date.getTime() === selectedTime) ?? summary.points.at(-1);
  const change = selected ? trendChange(summary.points, selected.date) : null;
  const max = Math.max(...summary.points.map((point) => Math.abs(point.amount)), 1);
  const steps = maxPage + 1;

  return (
    <article className="st3">
      <header className="st3-head">
        <h2>Expense trend</h2>
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
      </header>
      <div className="st3-shell">
        <div className="st3-panel">
          <div className="st3-summary">
            <p>Average spending • {pageLabel(summary.points, monthly)}</p>
            <div className="st3-amount">
              <p className="st3-value">
                <CopyAmount>{formatRupiah(summary.average)}</CopyAmount>
              </p>
              <TrendPill change={overall} />
            </div>
          </div>
          <div className="st3-chart" role="listbox" aria-label="Spending">
            {summary.points.map((point) => {
              const magnitude = Math.abs(point.amount);
              const ratio = magnitude / max;
              const active = selected && point.date.getTime() === selected.date.getTime();
              return (
                <Column
                  key={point.date.getTime()}
                  point={point}
                  active={active}
                  ratio={ratio}
                  minimum={ratio * PLOT < MIN_BAR + STEM_FLOOR}
                  onSelect={() => setSelectedTime(point.date.getTime())}
                />
              );
            })}
          </div>
          <div className="st3-page">
            <Button
              variant="navigation"
              icon={buttonIcons.arrowLeft}
              aria-label={monthly ? "Previous month" : "Previous day"}
              disabled={safePage >= maxPage}
              onClick={() => setPage((current) => Math.min(maxPage, current + 1))}
            />
            <StepTrack
              steps={steps}
              index={maxPage - safePage}
              label={monthly ? "Year" : "Days"}
              onChange={(next) => {
                setPage(maxPage - next);
                setSelectedTime(null);
              }}
            />
            <Button
              variant="navigation"
              icon={buttonIcons.arrowRight}
              aria-label={monthly ? "Next month" : "Next day"}
              disabled={safePage === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            />
          </div>
        </div>
        <footer className="st3-foot">
          <TrendPill change={change} />
          <p className="st3-note">
            {selected ? `Compare to ${previousLabel(selected.date, monthly)}, spending in ${selected.weekday}` : "Spending"}
            <span>
              <CopyAmount>{selected ? formatRupiah(selected.amount) : formatRupiah(0)}</CopyAmount>
            </span>
          </p>
        </footer>
      </div>
    </article>
  );
}
