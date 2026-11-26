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
  const hex = color.replace("#", "");
  const channel = (start) => (Number.parseInt(hex.slice(start, start + 2), 16) / 255).toFixed(5);
  const shadow = `0 0 0 0 ${channel(0)} 0 0 0 0 ${channel(2)} 0 0 0 0 ${channel(4)} 0 0 0 0.24 0`;
  return svg
    .replaceAll("#EC407A", color)
    .replaceAll("0 0 0 0 0.92549 0 0 0 0 0.25098 0 0 0 0 0.478431 0 0 0 0.24 0", shadow)
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

function rowsFor(transactions, today, limit) {
  const month = today.getMonth();
  const year = today.getFullYear();
  const rows = transactions
    .filter((row) => row.date.getMonth() === month && row.date.getFullYear() === year)
    .filter((row) => row.type === "INCOME" || row.type === "EXPENSE")
    .sort((a, b) => b.date - a.date || b.amount - a.amount);
  return limit ? rows.slice(0, limit) : rows;
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function groupsFor(rows) {
  const groups = [];
  rows.forEach((row) => {
    const key = dayKey(row.date);
    let group = groups.find((entry) => entry.key === key);
    if (!group) {
      group = { key, date: row.date, rows: [], spent: 0, income: 0 };
      groups.push(group);
    }
    group.rows.push(row);
    if (row.type === "EXPENSE") group.spent += row.amount;
    if (row.type === "INCOME") group.income += row.amount;
  });
  return groups;
}

function TransactionRow({ row, iconId, showDate }) {
  const color = categoryColor(row.category_l1);
  const credit = row.type === "INCOME";
  return (
    <button type="button" className="tx-row">
      <div className="tx-main">
        <span className="tx-mark" style={{ "--tx": color }} dangerouslySetInnerHTML={{ __html: tintIcon(barsIcon, color, iconId) }} />
        <span className="tx-copy">
          <span className="tx-name">{row.category_l1}</span>
          {showDate || row.note ? (
            <span className="tx-meta">
              {showDate ? <span className="tx-date">{formatStamp(row.date)}</span> : null}
              {row.note ? (
                <>
                  {showDate ? <span className="tx-dot" dangerouslySetInnerHTML={{ __html: dotIcon }} /> : null}
                  <span className="tx-note">{row.note}</span>
                </>
              ) : null}
            </span>
          ) : null}
        </span>
      </div>
      <span className="tx-side">
        <span className={credit ? "tx-amount is-credit" : "tx-amount"}>
          {credit ? formatSignedRupiah(row.amount) : formatRupiah(row.amount)}
        </span>
        <span className="tx-chevron" dangerouslySetInnerHTML={{ __html: rowArrow }} />
      </span>
    </button>
  );
}

export function TransactionListCard({ transactions, today = new Date(), onSeeMore, grouped = false }) {
  const baseId = useId().replace(/:/g, "");
  const rows = rowsFor(transactions, today, grouped ? 0 : ROW_LIMIT);

  if (!grouped) {
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
          {rows.map((row, index) => (
            <TransactionRow key={`${dayKey(row.date)}-${row.category_l1}-${index}`} row={row} iconId={`${baseId}-${index}`} showDate />
          ))}
        </div>
      </article>
    );
  }

  const groups = groupsFor(rows);

  if (groups.length === 0) {
    return (
      <article className="tx-card">
        <p className="tx-empty">No transactions for this search.</p>
      </article>
    );
  }

  return (
    <div className="tx-days">
      {groups.map((group) => (
        <article className="tx-card" key={group.key}>
          <header className="tx-day">
            <h2>{formatStamp(group.date)}</h2>
            <p>{group.spent > 0 ? `Spent ${formatRupiah(group.spent)}` : `Income ${formatSignedRupiah(group.income)}`}</p>
          </header>
          <div className="tx-list">
            {group.rows.map((row, index) => (
              <TransactionRow key={`${group.key}-${row.category_l1}-${index}`} row={row} iconId={`${baseId}-${group.key}-${index}`} />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
