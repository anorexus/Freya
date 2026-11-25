import { useMemo, useState } from "react";
import { CATEGORIES } from "../../../src/data/categories.ts";
import transactionsIcon from "../assets/icons/transactions.svg?raw";
import searchIcon from "../assets/icons/search.svg?raw";
import { sampleTransactions } from "../cashflow.js";
import { formatRupiah } from "../money.js";
import { AddTransactionCard } from "./AddTransactionCard.jsx";
import { Button, WalletDropdown, buttonIcons } from "./Button.jsx";
import { CashflowCard } from "./CashflowCard.jsx";
import { ExpenseCard } from "./ExpenseCard.jsx";
import { LiquidityCard } from "./LiquidityCard.jsx";
import { TransactionListCard } from "./TransactionListCard.jsx";
import "./Dashboard.css";
import "./Transactions.css";

const WALLETS = [
  { id: "bca", name: "BCA", balance: 12400000 },
  { id: "cash", name: "Main Cash", balance: 4820000 },
  { id: "gopay", name: "GoPay", balance: 1280000 },
];

function formatMonth(date) {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function formatRange(start, end) {
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const endLabel = end.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return sameYear ? `${startLabel} – ${endLabel}` : `${startLabel} ${start.getFullYear()} – ${endLabel}`;
}

function matches(row, query) {
  const haystack = [row.category_l1, row.type, row.note, formatRupiah(row.amount)].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query);
}

export function Transactions({ onMenu = () => {} }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [logOpen, setLogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const now = new Date();
  const transactions = useMemo(() => sampleTransactions(now), [now.getFullYear(), now.getMonth(), now.getDate()]);
  const view = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthEnd = new Date(view.getFullYear(), view.getMonth() + 1, 0);
  const today = monthOffset === 0 ? now : monthEnd;
  const rangeStart = new Date(view.getFullYear(), view.getMonth(), 1);
  const rangeEnd = monthOffset === 0 ? now : monthEnd;
  const needle = query.trim().toLowerCase();
  const visible = needle ? transactions.filter((row) => matches(row, needle)) : transactions;

  return (
    <main className="dash tx-screen">
      <header className="dash-bar">
        <Button className="dash-menu" variant="secondary" iconOnly icon={buttonIcons.menu} aria-label="Open menu" onClick={onMenu} />
        <h1 className="dash-title">
          <span className="dash-title-icon" dangerouslySetInnerHTML={{ __html: transactionsIcon }} />
          Transactions
        </h1>
        <div className="dash-actions">
          <div className="dash-sync">
            <p>
              <span className="dash-dot" />
              Synced 22 Nov 2026, 08:33
            </p>
            <Button variant="secondary" icon={buttonIcons.sync}>Sync</Button>
          </div>
          <Button className="dash-add" variant="primary" icon={buttonIcons.add} onClick={() => setLogOpen(true)}>Add transaction</Button>
        </div>
      </header>
      <div className="dash-content">
        <div className="dash-period">
          <div className="dash-period-main">
            <span className="dash-prev">
              <Button variant="navigation" icon={buttonIcons.arrowLeft} aria-label="Previous month" onClick={() => setMonthOffset((offset) => offset - 1)} />
            </span>
            <div className="dash-period-copy">
              <p className="dash-month">{formatMonth(view)}</p>
              <p className="dash-range">{formatRange(rangeStart, rangeEnd)}</p>
            </div>
            <Button variant="navigation" icon={buttonIcons.arrowRight} aria-label="Next month" disabled={monthOffset >= 0} onClick={() => setMonthOffset((offset) => Math.min(0, offset + 1))} />
          </div>
          <WalletDropdown wallets={WALLETS} />
        </div>
        <label className="tx-search">
          <span className="tx-search-icon" dangerouslySetInnerHTML={{ __html: searchIcon }} />
          <input
            type="search"
            value={query}
            placeholder="Search transactions"
            aria-label="Search transactions"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <section className="dash-grid" aria-label="Summary">
          <LiquidityCard wallets={WALLETS} today={today} />
          <CashflowCard transactions={transactions} today={today} />
          <ExpenseCard transactions={transactions} categories={CATEGORIES} today={today} />
        </section>
        <TransactionListCard transactions={visible} today={today} grouped />
      </div>
      <AddTransactionCard open={logOpen} wallets={WALLETS} onClose={() => setLogOpen(false)} />
    </main>
  );
}
