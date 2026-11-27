import { CopyAmount } from "./CopyAmount.jsx";
import { expenseBreakdown, formatShare } from "../expense.js";
import { formatRupiah } from "../money.js";
import { Pill } from "./Pill.jsx";
import "./LiquidityCard.css";
import "./CashflowCard.css";
import "./ExpenseCard.css";

export function ExpenseCard({ transactions, categories, today = new Date() }) {
  const summary = expenseBreakdown(transactions, categories, today);
  const top = summary.top;

  return (
    <article className="liq-card">
      <header className="liq-card-head">
        <h2>Monthly expense</h2>
      </header>
      <div className="liq-card-body">
        <div className="liq-amount">
          <div className="liq-balance">
            <p className="liq-amount-label">Expenses so far</p>
            <p className="liq-amount-value"><CopyAmount>{formatRupiah(summary.total)}</CopyAmount></p>
          </div>
          <div className="cf-timeline">
            <div className="ex-spacer" aria-hidden="true" />
            <div className="ex-track" aria-hidden="true">
              {summary.slices.map((slice) => (
                <div
                  key={slice.name}
                  className="ex-seg"
                  style={{ flexGrow: slice.amount, "--seg": slice.color }}
                />
              ))}
            </div>
          </div>
        </div>
        <footer className="liq-foot">
          {top ? (
            <>
              <Pill className="ex-pill" style={{ "--pill": top.color }}>
                {top.name}
              </Pill>
              <p className="cf-note">
                Top category with total
                <span className="cf-avg">
                  <CopyAmount>{formatRupiah(top.amount)}</CopyAmount>
                  {` (${formatShare(summary.topShare)})`}
                </span>
              </p>
            </>
          ) : (
            <p className="cf-note">No expenses yet</p>
          )}
        </footer>
      </div>
    </article>
  );
}
