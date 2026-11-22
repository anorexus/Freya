import { useMemo, useState } from "react";
import { groupByMonth, groupReceipts, receiptMatches } from "../domain/aggregate";
import { formatMonth } from "../domain/money";
import { useLedger } from "../state/LedgerContext";
import { TransactionList } from "../components/TransactionList";

type TypeFilter = "ALL" | "INCOME" | "EXPENSE";

export function Transactions() {
  const ledger = useLedger();
  const [type, setType] = useState<TypeFilter>("ALL");
  const [monthKey, setMonthKey] = useState<string | null>(null);
  const receipts = useMemo(() => {
    return groupReceipts(ledger.rows).filter((receipt) => {
      if (type !== "ALL" && receipt.type !== type) return false;
      return receiptMatches(receipt, ledger.query);
    });
  }, [ledger.rows, ledger.query, type]);
  const months = useMemo(() => groupByMonth(receipts), [receipts]);
  const activeKey = months.some((month) => month.key === monthKey) ? monthKey : (months[0]?.key ?? null);
  const activeIndex = months.findIndex((month) => month.key === activeKey);
  const active = activeIndex >= 0 ? months[activeIndex] : null;
  const severalYears = new Set(months.map((month) => month.key.slice(0, 4))).size > 1;

  return (
    <>
      <div className="fy-tx-header">
        <div>
          <h2 className="fy-page-title">Transactions</h2>
          <p className="fy-page-sub">
            <span>{receiptLabel(active?.receipts.length ?? 0)}</span>
            <span>Grouped by receipt</span>
          </p>
        </div>
        {months.length > 0 ? (
          <nav className="fy-month-pager" aria-label="Months">
            <button
              className="fy-btn fy-btn-ghost fy-icon-btn"
              type="button"
              aria-label="Older month"
              disabled={activeIndex >= months.length - 1}
              onClick={() => setMonthKey(months[activeIndex + 1].key)}
            >
              ‹
            </button>
            {months.map((month) => (
              <button
                key={month.key}
                className={month.key === activeKey ? "fy-btn fy-btn-secondary" : "fy-btn fy-btn-ghost"}
                type="button"
                aria-current={month.key === activeKey ? "true" : undefined}
                onClick={() => setMonthKey(month.key)}
              >
                {monthLabel(month.key, severalYears)}
              </button>
            ))}
            <button
              className="fy-btn fy-btn-ghost fy-icon-btn"
              type="button"
              aria-label="Newer month"
              disabled={activeIndex <= 0}
              onClick={() => setMonthKey(months[activeIndex - 1].key)}
            >
              ›
            </button>
          </nav>
        ) : null}
      </div>
      <div className="fy-actions">
        <FilterButton current={type} id="ALL" onSelect={setType}>
          All
        </FilterButton>
        <FilterButton current={type} id="INCOME" onSelect={setType}>
          Income
        </FilterButton>
        <FilterButton current={type} id="EXPENSE" onSelect={setType}>
          Expense
        </FilterButton>
      </div>
      <section className="fy-card">
        <TransactionList
          receipts={active?.receipts ?? []}
          emptyLabel={ledger.rows.length === 0 ? "No transactions yet." : "No receipts match that filter."}
        />
      </section>
    </>
  );
}

function monthLabel(key: string, withYear: boolean): string {
  const name = formatMonth(`${key}-01`, "short");
  return withYear ? `${name} ${key.slice(2, 4)}` : name;
}

function receiptLabel(count: number): string {
  return count === 1 ? "1 receipt" : `${count} receipts`;
}

function FilterButton({
  current,
  id,
  onSelect,
  children,
}: {
  current: TypeFilter;
  id: TypeFilter;
  onSelect: (id: TypeFilter) => void;
  children: string;
}) {
  return (
    <button className={current === id ? "fy-btn fy-btn-secondary" : "fy-btn fy-btn-ghost"} type="button" onClick={() => onSelect(id)}>
      {children}
    </button>
  );
}
