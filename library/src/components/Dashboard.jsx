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
import { SpendingCard } from "./SpendingCard.jsx";
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

const SAMPLE_NOTICE = {
  title: "Row 14 excluded.",
  detail: "Invalid amount. Fix it in the sheet, then sync. Logging stays available.",
};

export function Dashboard({
  onMenu = () => {},
  transactions: transactionsProp,
  wallets: walletsProp,
  syncedLabel = "Synced 22 Nov 2026, 08:33",
  onSync,
  syncDisabled = false,
  notice,
  onSeeMore,
  onSave,
  addDisabled = false,
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [logOpen, setLogOpen] = useState(false);
  const [walletId, setWalletId] = useState("all");
  const now = new Date();
  const transactions = transactionsProp ?? sampleTransactions(now);
  const wallets = walletsProp ?? WALLETS;
  const canFilter = transactions.some((row) => row.wallet_id);
  const visible = !canFilter || walletId === "all" ? transactions : transactions.filter((row) => row.wallet_id === walletId);
  const visibleWallets = walletId === "all" ? wallets : wallets.filter((wallet) => wallet.id === walletId);
  const banner = notice === undefined && transactionsProp === undefined ? SAMPLE_NOTICE : notice;
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
              {syncedLabel}
            </p>
            <Button variant="secondary" icon={buttonIcons.sync} onClick={onSync} disabled={syncDisabled}>Sync</Button>
          </div>
          <Button className="dash-add" variant="primary" icon={buttonIcons.add} disabled={addDisabled} onClick={() => setLogOpen(true)}>Add transaction</Button>
          <WalletDropdown className="dash-wallets-bar" wallets={wallets} value={walletId} onChange={setWalletId} />
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
          <WalletDropdown className="dash-wallets-period" wallets={wallets} value={walletId} onChange={setWalletId} />
        </div>
        {banner ? (
          <Notification tone="notice" title={banner.title}>
            {banner.detail}
          </Notification>
        ) : null}
        <section className="dash-grid" aria-label="Summary">
          <LiquidityCard wallets={visibleWallets} today={today} />
          <CashflowCard transactions={visible} today={today} />
          <ExpenseCard transactions={visible} categories={CATEGORIES} today={today} />
        </section>
        <section className="dash-grid is-trends" aria-label="Spending by category">
          <SpendingCard transactions={visible} categories={CATEGORIES} today={today} />
          <TrendCardV3 transactions={visible} today={now} focus={today} />
        </section>
        <section className="dash-span" aria-label="Calendar">
          <CalendarCard transactions={visible} today={now} focus={today} onToday={() => setMonthOffset(0)} />
        </section>
        <section className="dash-grid is-trends" aria-label="Trends">
          <CashflowCardV2 transactions={visible} today={now} focus={today} />
          <TrendCardV3 transactions={visible} today={now} focus={today} />
        </section>
        <section className="dash-span" aria-label="Transactions">
          <TransactionListCard
            transactions={visible}
            today={today}
            onSeeMore={onSeeMore ?? (() => { window.location.hash = "transactions"; })}
          />
        </section>
      </div>
      <AddTransactionCardV2 open={logOpen} wallets={wallets} onClose={() => setLogOpen(false)} onSave={onSave} />
    </main>
  );
}
