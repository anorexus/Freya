import { CopyAmount } from "./CopyAmount.jsx";
import { cashflowSummary, formatTrend } from "../cashflow.js";
import { formatRupiah, formatSignedRupiah } from "../money.js";
import { Pill } from "./Pill.jsx";
import "./LiquidityCard.css";
import "./CashflowCard.css";

function cashflowLevel(share) {
  if (share < 1 / 3) return "negative";
  if (share < 2 / 3) return "warning";
  return "positive";
}

export function CashflowCard({ transactions, today = new Date() }) {
  const summary = cashflowSummary(transactions, today);
  const trendLevel = summary.trend > 0 ? "positive" : summary.trend < 0 ? "negative" : null;

  return (
    <article className="liq-card">
      <header className="liq-card-head">
        <h2>Net cashflow</h2>
      </header>
      <div className="liq-card-body">
        <div className="liq-amount">
          <div className="liq-balance">
            <p className="liq-amount-label">Cashflow</p>
            <p className="liq-amount-value"><CopyAmount>{formatRupiah(summary.net)}</CopyAmount></p>
          </div>
          <div className="cf-timeline is-split">
            <div className="cf-split">
              <p>
                <span>Income</span>
                <span className="cf-income"><CopyAmount>{formatSignedRupiah(summary.income)}</CopyAmount></span>
              </p>
              <p>
                <span>Expense</span>
                <span className="cf-expense"><CopyAmount>{formatRupiah(summary.expense)}</CopyAmount></span>
              </p>
            </div>
            <div className="cf-track" aria-hidden="true">
              <div
                className={`cf-fill is-${cashflowLevel(summary.incomeShare)}`}
                style={{ width: `${summary.incomeShare * 100}%` }}
              />
            </div>
          </div>
        </div>
        <footer className="liq-foot">
          <Pill tone={trendLevel || "down"}>{formatTrend(summary.trend)}</Pill>
          <p className="cf-note">
            Average daily spending
            <span className="cf-avg"><CopyAmount>{formatRupiah(summary.averageSpend)}</CopyAmount></span>
          </p>
        </footer>
      </div>
    </article>
  );
}
