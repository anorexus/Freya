import { useState } from "react";
import { CATEGORIES } from "../../../src/data/categories.ts";
import dashboardIcon from "../assets/icons/dashboard.svg?raw";
import { sampleTransactions } from "../cashflow.js";
import { AddTransactionCardV2 } from "./AddTransactionCardV2.jsx";
import { Button, WalletDropdown, buttonIcons } from "./Button.jsx";
import { CalendarCard } from "./CalendarCard.jsx";
import { CashflowCard } from "./CashflowCard.jsx";
import { CashflowCardV2 } from "./CashflowCardV2.jsx";
import { ExpenseCard } from "./ExpenseCard.jsx";
import { LiquidityCard } from "./LiquidityCard.jsx";
import { Notification } from "./Notification.jsx";
import { TransactionListCard } from "./TransactionListCard.jsx";
import { TrendCardV3 } from "./TrendCardV3.jsx";
import "./Dashboard.css";

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

export function Dashboard({ onMenu = () => {} }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [logOpen, setLogOpen] = useState(false);
  const now = new Date();
  const transactions = sampleTransactions(now);
  const view = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthEnd = new Date(view.getFullYear(), view.getMonth() + 1, 0);
  const today = monthOffset === 0 ? now : monthEnd;
  const rangeStart = new Date(view.getFullYear(), view.getMonth(), 1);
  const rangeEnd = monthOffset === 0 ? now : monthEnd;

  return (
    <main className="dash">
      <header className="dash-bar">
        <Button className="dash-menu" variant="secondary" iconOnly icon={buttonIcons.menu} aria-label="Open menu" onClick={onMenu} />
        <h1 className="dash-title">
          <span className="dash-title-icon" dangerouslySetInnerHTML={{ __html: dashboardIcon }} />
          Dashboard
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
        <Notification tone="notice" title="Row 14 excluded.">
          Invalid amount. Fix it in the sheet, then sync. Logging stays available.
        </Notification>
        <section className="dash-grid" aria-label="Summary">
          <LiquidityCard wallets={WALLETS} today={today} />
          <CashflowCard transactions={transactions} today={today} />
          <ExpenseCard transactions={transactions} categories={CATEGORIES} today={today} />
        </section>
        <section className="dash-span" aria-label="Calendar">
          <CalendarCard transactions={transactions} today={now} focus={today} onToday={() => setMonthOffset(0)} />
        </section>
        <section className="dash-grid is-trends" aria-label="Trends">
          <CashflowCardV2 transactions={transactions} today={now} focus={today} />
          <TrendCardV3 transactions={transactions} today={now} focus={today} />
        </section>
        <section className="dash-span" aria-label="Transactions">
          <TransactionListCard transactions={transactions} today={today} onSeeMore={() => { window.location.hash = "transactions"; }} />
        </section>
      </div>
      <AddTransactionCardV2 open={logOpen} wallets={WALLETS} onClose={() => setLogOpen(false)} />
    </main>
  );
}
