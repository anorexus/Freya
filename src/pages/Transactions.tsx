import { useMemo, useState } from "react";
import { groupReceipts, receiptMatches } from "../domain/aggregate";
import { useLedger } from "../state/LedgerContext";
import { TransactionList } from "../components/TransactionList";

type TypeFilter = "ALL" | "INCOME" | "EXPENSE";

export function Transactions() {
  const ledger = useLedger();
  const [type, setType] = useState<TypeFilter>("ALL");
  const receipts = useMemo(() => {
    return groupReceipts(ledger.rows).filter((receipt) => {
      if (type !== "ALL" && receipt.type !== type) return false;
      return receiptMatches(receipt, ledger.query);
    });
  }, [ledger.rows, ledger.query, type]);

  return (
    <>
      <div>
        <h2 className="fy-page-title">Transactions</h2>
        <p className="fy-page-sub">
          <span>
            {receipts.length === 1 ? "1 receipt" : `${receipts.length} receipts`}
          </span>
          <span>Grouped by receipt</span>
        </p>
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
          receipts={receipts}
          emptyLabel={ledger.rows.length === 0 ? "No transactions yet." : "No receipts match that filter."}
        />
      </section>
    </>
  );
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
