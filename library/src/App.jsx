import { CATEGORIES } from "../../src/data/categories.ts";
import { sampleTransactions } from "./cashflow.js";
import { Button, WalletDropdown, buttonIcons } from "./components/Button.jsx";
import { CashflowCard } from "./components/CashflowCard.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { ExpenseCard } from "./components/ExpenseCard.jsx";
import { TrendCard } from "./components/TrendCard.jsx";
import { LiquidityCard } from "./components/LiquidityCard.jsx";
import { Notification } from "./components/Notification.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import "./tokens.css";
import "./app.css";

const wallets = [
  { id: "bca", name: "BCA", balance: 12400000 },
  { id: "cash", name: "Main Cash", balance: 4820000 },
  { id: "gopay", name: "GoPay", balance: 1280000 },
];

const swatches = [
  ["Card", "var(--liq-card)"],
  ["Panel", "var(--liq-panel)"],
  ["Footer", "var(--liq-footer)"],
  ["Text", "var(--liq-text)"],
  ["Muted", "var(--liq-muted)"],
  ["Accent", "var(--liq-accent)"],
  ["Positive", "var(--liq-positive)"],
  ["Warning", "var(--liq-warning)"],
  ["Negative", "var(--liq-negative)"],
  ["Notice", "var(--liq-notice)"],
  ["Pink", "var(--liq-pink)"],
  ["Deep purple", "var(--liq-deep-purple)"],
  ["Blue", "var(--liq-blue)"],
  ["Light green", "var(--liq-light-green)"],
  ["Amber", "var(--liq-amber)"],
  ["Deep orange", "var(--liq-deep-orange)"],
  ["Chart", "var(--liq-chart)"],
  ["Selected", "var(--liq-chart-selected)"],
];

function LibraryPage() {
  return (
      <main className="lib-page">
      <p className="lib-kicker">Freya library</p>
      <section className="lib-buttons" aria-label="Buttons">
        <Button variant="secondary" icon={buttonIcons.sync}>Sync</Button>
        <Button variant="primary" icon={buttonIcons.add}>Add transaction</Button>
        <Button variant="navigation" icon={buttonIcons.expand} aria-label="Expand" />
        <WalletDropdown options={["All wallets", ...wallets.map((wallet) => wallet.name)]} />
      </section>
      <LiquidityCard wallets={wallets} today={new Date(2026, 10, 7)} />
      <CashflowCard transactions={sampleTransactions()} />
      <ExpenseCard transactions={sampleTransactions()} categories={CATEGORIES} />
      <TrendCard transactions={sampleTransactions()} today={new Date(2026, 10, 23)} />
      <Notification tone="notice" title="Row 14 excluded.">
        Invalid amount. Fix it in the sheet, then sync. Logging stays available.
      </Notification>
      <Notification tone="positive" title="Sheet synced.">
        Transactions are up to date.
      </Notification>
      <Notification tone="negative" title="Logging is paused.">
        The sheet headers no longer match. Restore the template to log new rows.
      </Notification>
      <section className="lib-swatches" aria-label="Library colors">
        {swatches.map(([name, color]) => (
          <div key={name} className="lib-swatch">
            <span style={{ background: color }} />
            <b>{name}</b>
          </div>
        ))}
      </section>
      <section className="lib-swatches" aria-label="Category colors">
        {CATEGORIES.map((category) => (
          <div key={category.l1} className="lib-swatch">
            <span style={{ background: category.color }} />
            <b>{category.l1}</b>
          </div>
        ))}
      </section>
    </main>
  );
}

export default function App() {
  const library = window.location.hash === "#library";

  return (
    <div className="lib-shell">
      <Sidebar />
      {library ? <LibraryPage /> : <Dashboard />}
    </div>
  );
}
