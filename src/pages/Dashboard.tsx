import type { ReactNode } from "react";
import { groupReceipts, monthTotals, receiptMatches, trailingExpenseDays, trailingMonthSeries } from "../domain/aggregate";
import { formatAmount, formatDelta, formatMonth, todayISO } from "../domain/money";
import { issueSummary, useLedger } from "../state/LedgerContext";
import { CashflowChart, WeekChart } from "../components/Charts";
import { TransactionList } from "../components/TransactionList";

export function Dashboard() {
  const ledger = useLedger();
  const today = todayISO();
  const month = today.slice(0, 7);
  const totals = monthTotals(ledger.rows, month);
  const previous = monthTotals(ledger.rows, previousMonth(month));
  const months = trailingMonthSeries(ledger.rows, today);
  const days = trailingExpenseDays(ledger.rows, today);
  const weekTotal = days.reduce((sum, day) => sum + day.amount, 0);
  const receipts = groupReceipts(ledger.rows).filter((receipt) => receiptMatches(receipt, ledger.query)).slice(0, 6);
  const summary = issueSummary(ledger.issues);
  const empty = ledger.rows.length === 0;
  const monthTitle = `${formatMonth(`${month}-01`)} cashflow`;

  return (
    <>
      <div>
        <h2 className="fy-page-title">{empty ? "Cashflow" : monthTitle}</h2>
        {empty ? (
          <p className="fy-page-sub">
            <span className="fy-sample">Sample chart, not your data</span>
          </p>
        ) : (
          <p className="fy-page-sub">
            <span>Income Rp {formatAmount(totals.income)}</span>
            <span>Expense Rp {formatAmount(totals.expense)}</span>
            <span>Net Rp {formatAmount(totals.net)}</span>
          </p>
        )}
      </div>

      <StatusBanner schemaMessage={ledger.schema.ok ? null : ledger.schema.message} summary={summary} />

      {empty ? (
        <EmptyDashboard onLog={() => ledger.setLogOpen(true)} />
      ) : (
        <>
          <div className="fy-stat-row">
            <Stat label="Income" value={formatAmount(totals.income)} meta={deltaMeta(totals.income, previous.income, "fy-up", month)} compact />
            <Stat label="Expense" value={formatAmount(totals.expense)} meta={deltaMeta(totals.expense, previous.expense, "fy-down", month)} compact />
            <Stat label="Net" value={formatAmount(totals.net)} meta="Income minus expense" compact />
            <Stat label="Receipts" value={String(totals.receipts)} meta={`${totals.skus} SKU lines`} />
          </div>

          <div className="fy-split">
            <section className="fy-card" aria-label="Six month cashflow">
              <div className="fy-card-head">
                <h3 className="fy-card-title">6-month cashflow</h3>
                <div className="fy-legend">
                  <span>
                    <i className="fy-swatch-income" />
                    Income
                  </span>
                  <span>
                    <i className="fy-swatch-expense" />
                    Expense
                  </span>
                </div>
              </div>
              <CashflowChart points={months} />
            </section>
            <section className="fy-card" aria-label="Seven day expense">
              <div className="fy-card-head">
                <h3 className="fy-card-title">7-day expense</h3>
                <span className="fy-card-note">Rp {formatAmount(weekTotal)}</span>
              </div>
              <WeekChart points={days} />
            </section>
          </div>

          <section className="fy-card">
            <div className="fy-card-head">
              <h3 className="fy-card-title">Transactions</h3>
              <span className="fy-card-note">Grouped by receipt</span>
            </div>
            <TransactionList
              receipts={receipts}
              expandFirst
              emptyLabel={ledger.query ? "No receipts match that search." : "No transactions yet."}
            />
          </section>
        </>
      )}
    </>
  );
}

function EmptyDashboard({ onLog }: { onLog: () => void }) {
  const sample = [
    { key: "06", label: "Jun", income: 78, expense: 46 },
    { key: "07", label: "Jul", income: 74, expense: 52 },
    { key: "08", label: "Aug", income: 80, expense: 41 },
    { key: "09", label: "Sep", income: 70, expense: 58 },
    { key: "10", label: "Oct", income: 84, expense: 44 },
    { key: "11", label: "Nov", income: 92, expense: 48 },
  ];
  return (
    <>
      <section className="fy-card">
        <div className="fy-card-head">
          <h3 className="fy-card-title">6-month cashflow</h3>
          <span className="fy-sample">Sample chart, not your data</span>
        </div>
        <CashflowChart points={sample} />
      </section>
      <section className="fy-card">
        <div className="fy-empty">
          <h3>No transactions yet</h3>
          <p>Log the first receipt, or load the sample ledger to see how a month of rupiah looks.</p>
          <button className="fy-btn fy-btn-primary" type="button" onClick={onLog}>
            Log first transaction
          </button>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, meta, compact = false }: { label: string; value: string; meta: ReactNode; compact?: boolean }) {
  return (
    <article className="fy-stat">
      <p className="fy-stat-label">{label}</p>
      <p className={compact ? "fy-stat-value is-compact" : "fy-stat-value"}>{value}</p>
      <p className="fy-stat-meta">{meta}</p>
    </article>
  );
}

function deltaMeta(current: number, previous: number, tone: "fy-up" | "fy-down", month: string): ReactNode {
  const delta = formatDelta(current, previous);
  const versus = `vs ${formatMonth(`${previousMonth(month)}-01`)}`;
  if (!delta) return versus;
  return (
    <>
      <span className={tone}>{delta}</span> {versus}
    </>
  );
}

function previousMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 2, 1));
  return date.toISOString().slice(0, 7);
}

function StatusBanner({
  schemaMessage,
  summary,
}: {
  schemaMessage: string | null;
  summary: { title: string; detail: string } | null;
}) {
  if (schemaMessage) {
    return (
      <div className="fy-banner fy-banner-block" role="alert">
        <strong>Sheet headers no longer match Freya.</strong>
        <p>{schemaMessage}</p>
      </div>
    );
  }
  if (!summary) return null;
  return (
    <div className="fy-banner fy-banner-warn" role="status">
      <strong>{summary.title}</strong>
      <p>{summary.detail}</p>
    </div>
  );
}
