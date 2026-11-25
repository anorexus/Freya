import { useId } from "react";
import { CATEGORIES } from "../../../src/data/categories.ts";
import barsIcon from "../assets/icons/tx-bars.svg?raw";
import rowArrow from "../assets/icons/tx-arrow.svg?raw";
import seeMoreIcon from "../assets/icons/tx-see.svg?raw";
import dotIcon from "../assets/icons/tx-dots.svg?raw";
import { formatRupiah, formatSignedRupiah } from "../money.js";
import "./Button.css";
import "./TransactionListCard.css";

const ROW_LIMIT = 6;

function tintIcon(svg, color, id) {
  return svg
    .replaceAll("#EC407A", color)
    .replaceAll("filter0_i_0_375", `${id}-f`)
    .replaceAll("paint0_linear_0_375", `${id}-p0`)
    .replaceAll("paint1_linear_0_375", `${id}-p1`);
}

function categoryColor(name) {
  return CATEGORIES.find((category) => category.l1 === name)?.color ?? "#EC407A";
}

function formatStamp(date) {
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${weekday}, ${day}`;
}

function rowsFor(transactions, today) {
  const month = today.getMonth();
  const year = today.getFullYear();
  return transactions
    .filter((row) => row.date.getMonth() === month && row.date.getFullYear() === year)
    .filter((row) => row.type === "INCOME" || row.type === "EXPENSE")
    .sort((a, b) => b.date - a.date || b.amount - a.amount)
    .slice(0, ROW_LIMIT);
}

export function TransactionListCard({ transactions, today = new Date(), onSeeMore }) {
  const baseId = useId().replace(/:/g, "");
  const rows = rowsFor(transactions, today);

  return (
    <article className="tx-card">
      <header className="tx-card-head">
        <h2>Transactions</h2>
        <button type="button" className="fy-btn is-secondary tx-more" onClick={onSeeMore}>
          See more
          <span className="fy-glyph" dangerouslySetInnerHTML={{ __html: seeMoreIcon }} />
        </button>
      </header>
      <div className="tx-list">
        {rows.map((row, index) => {
          const color = categoryColor(row.category_l1);
          const credit = row.type === "INCOME";
          return (
            <div className="tx-row" key={`${row.date.toISOString()}-${row.category_l1}-${index}`}>
              <div className="tx-main">
                <span
                  className="tx-mark"
                  style={{ "--tx": color }}
                  dangerouslySetInnerHTML={{ __html: tintIcon(barsIcon, color, `${baseId}-${index}`) }}
                />
                <span className="tx-copy">
                  <span className="tx-name">{row.category_l1}</span>
                  <span className="tx-meta">
                    <span className="tx-date">{formatStamp(row.date)}</span>
                    {row.note ? (
                      <>
                        <span className="tx-dot" dangerouslySetInnerHTML={{ __html: dotIcon }} />
                        <span className="tx-note">{row.note}</span>
                      </>
                    ) : null}
                  </span>
                </span>
              </div>
              <span className="tx-side">
                <span className={credit ? "tx-amount is-credit" : "tx-amount"}>
                  {credit ? formatSignedRupiah(row.amount) : formatRupiah(row.amount)}
                </span>
                <span className="tx-chevron" dangerouslySetInnerHTML={{ __html: rowArrow }} />
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}
