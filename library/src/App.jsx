import { CATEGORIES } from "../../src/data/categories.ts";
import { sampleTransactions } from "./cashflow.js";
import { CashflowCard } from "./components/CashflowCard.jsx";
import { ExpenseCard } from "./components/ExpenseCard.jsx";
import { LiquidityCard } from "./components/LiquidityCard.jsx";
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
];

export default function App() {
  return (
    <main className="lib-page">
      <p className="lib-kicker">Freya library</p>
      <LiquidityCard wallets={wallets} today={new Date(2026, 10, 7)} />
      <CashflowCard transactions={sampleTransactions()} />
      <ExpenseCard transactions={sampleTransactions()} categories={CATEGORIES} />
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
