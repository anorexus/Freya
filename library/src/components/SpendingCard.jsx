import { useState } from "react";
import { expenseBreakdown, formatShare } from "../expense.js";
import { formatRupiah } from "../money.js";
import { Pill } from "./Pill.jsx";
import "./SpendingCard.css";

const CX = 208;
const CY = 208;
const OUTER = 200;
const INNER = 136;
const CORNER = 4;

function point(radius, angle) {
  return [CX + radius * Math.cos(angle), CY - radius * Math.sin(angle)];
}

function tangent(angle) {
  return [-Math.sin(angle), -Math.cos(angle)];
}

function shift(origin, angle, distance) {
  const [tx, ty] = tangent(angle);
  return [origin[0] + tx * distance, origin[1] + ty * distance];
}

function fmt(xy) {
  return `${xy[0].toFixed(2)} ${xy[1].toFixed(2)}`;
}

function wedge(start, end) {
  const span = start - end;
  if (span <= 0.012) return "";
  const thickness = OUTER - INNER;
  let cr = Math.min(CORNER, thickness / 2 - 0.5);
  let betaOuter = Math.asin(Math.min(1, cr / (OUTER - cr)));
  let betaInner = Math.asin(Math.min(1, cr / (INNER + cr)));
  if (span <= betaOuter + betaInner + 0.01) {
    cr = Math.max(1, (span * INNER) / 3);
    betaOuter = Math.asin(Math.min(1, cr / (OUTER - cr)));
    betaInner = Math.asin(Math.min(1, cr / (INNER + cr)));
  }

  const outerLeft = point(OUTER, start - betaOuter);
  const outerRight = point(OUTER, end + betaOuter);
  const innerRight = point(INNER, end + betaInner);
  const innerLeft = point(INNER, start - betaInner);
  const capOuterLeft = shift(point(OUTER - cr, start - betaOuter), start - betaOuter, cr);
  const capInnerLeft = shift(point(INNER + cr, start - betaInner), start - betaInner, cr);
  const capOuterRight = shift(point(OUTER - cr, end + betaOuter), end + betaOuter, -cr);
  const capInnerRight = shift(point(INNER + cr, end + betaInner), end + betaInner, -cr);

  return [
    `M ${fmt(outerLeft)}`,
    `A ${OUTER} ${OUTER} 0 0 1 ${fmt(outerRight)}`,
    `A ${cr} ${cr} 0 0 1 ${fmt(capOuterRight)}`,
    `L ${fmt(capInnerRight)}`,
    `A ${cr} ${cr} 0 0 1 ${fmt(innerRight)}`,
    `A ${INNER} ${INNER} 0 0 0 ${fmt(innerLeft)}`,
    `A ${cr} ${cr} 0 0 1 ${fmt(capInnerLeft)}`,
    `L ${fmt(capOuterLeft)}`,
    `A ${cr} ${cr} 0 0 1 ${fmt(outerLeft)}`,
    "Z",
  ].join(" ");
}

export function SpendingCard({ transactions, categories, today = new Date() }) {
  const summary = expenseBreakdown(transactions, categories, today);
  const [active, setActive] = useState(null);
  const total = summary.total;
  const slices = summary.slices.slice(0, 6);
  const shown = slices.reduce((sum, slice) => sum + slice.amount, 0);
  const month = today.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  let cursor = Math.PI;
  const gap = 0.022;
  const arcs = slices.map((slice, index) => {
    const span = shown > 0 ? (slice.amount / shown) * Math.PI : 0;
    const lead = index === 0 ? 0 : gap / 2;
    const trail = index === slices.length - 1 ? 0 : gap / 2;
    const start = cursor - lead;
    const end = cursor - span + trail;
    cursor -= span;
    return { ...slice, share: total > 0 ? slice.amount / total : 0, d: span > gap ? wedge(start, end) : "" };
  });
  const top = arcs[0];

  return (
    <article className="spend-card">
      <header className="spend-head">
        <h2>Spending by category</h2>
      </header>
      <div className="spend-inner">
        <div className="spend-body">
          <div
            className="spend-chart"
            onPointerLeave={() => setActive(null)}
          >
            <svg viewBox="0 0 416 208" role="img" aria-label={`Spending by category, ${month}`}>
              <defs>
                <linearGradient id="spend-sheen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--outline-low)" />
                  <stop offset="1" stopColor="var(--outline-low)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {arcs.map((slice) =>
                slice.d ? (
                  <g
                    key={slice.name}
                    opacity={active && active !== slice.name ? 0.35 : 1}
                    onPointerEnter={() => setActive(slice.name)}
                  >
                    <path d={slice.d} fill={slice.color} />
                    <path d={slice.d} fill="url(#spend-sheen)" />
                  </g>
                ) : null,
              )}
            </svg>
            <p className="spend-total">
              <strong>{formatRupiah(total)}</strong>
              <span>{month}</span>
            </p>
          </div>
          <div className="spend-rows" onPointerLeave={() => setActive(null)}>
            {Array.from({ length: Math.ceil(arcs.length / 2) }, (_, row) => (
              <div key={row}>
                {row > 0 ? <div className="spend-rule" /> : null}
                <div className="spend-pair">
                  {arcs.slice(row * 2, row * 2 + 2).map((slice) => (
                    <button
                      key={slice.name}
                      type="button"
                      className={active && active !== slice.name ? "spend-row is-dim" : "spend-row"}
                      onPointerEnter={() => setActive(slice.name)}
                    >
                      <span className="spend-dot" style={{ background: slice.color }} />
                      <span className="spend-meta">
                        {slice.name}
                        <i />
                        <span>{formatShare(slice.share)}</span>
                      </span>
                      <span className="spend-amt">{formatRupiah(slice.amount)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <footer className="spend-foot">
          {top ? (
            <>
              <Pill tone="negative">{formatShare(top.share)}</Pill>
              <p>
                Largest category
                <strong>{formatRupiah(top.amount)}</strong>
              </p>
            </>
          ) : (
            <p>No expenses yet</p>
          )}
        </footer>
      </div>
    </article>
  );
}
