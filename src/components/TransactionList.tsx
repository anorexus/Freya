import { useEffect, useRef } from "react";
import type { Receipt } from "../domain/types";
import { formatDay, formatSignedAmount } from "../domain/money";
import { CatIcon } from "./Icons";

export function TransactionList({
  receipts,
  expandFirst = false,
  emptyLabel = "No receipts in this view.",
}: {
  receipts: Receipt[];
  expandFirst?: boolean;
  emptyLabel?: string;
}) {
  if (receipts.length === 0) {
    return <p className="fy-card-note">{emptyLabel}</p>;
  }

  return (
    <div className="fy-tx-list">
      {receipts.map((receipt, index) => (
        <ReceiptRow key={receipt.transactionId} receipt={receipt} initialOpen={expandFirst && index === 0} />
      ))}
    </div>
  );
}

function ReceiptRow({ receipt, initialOpen }: { receipt: Receipt; initialOpen: boolean }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const expandable = receipt.lines.length > 1 || receipt.lines.some((line) => line.itemName || line.categoryL2);

  useEffect(() => {
    if (initialOpen && ref.current) ref.current.open = true;
  }, [initialOpen]);

  const body = (
    <>
      <CatIcon name={receipt.categories[0] ?? ""} />
      <span>
        <span className="fy-tx-name">{receipt.categories.join(" · ")}</span>
        <span className="fy-tx-detail">{receiptDetail(receipt)}</span>
      </span>
      <span className={receipt.type === "INCOME" ? "fy-tx-amount fy-amount-in" : "fy-tx-amount fy-amount-out"}>
        {formatSignedAmount(receipt.type, receipt.total)}
      </span>
    </>
  );

  if (!expandable) {
    return <div className="fy-tx-static">{body}</div>;
  }

  return (
    <details className="fy-tx" ref={ref}>
      <summary>
        {body}
        <span className="fy-chevron" aria-hidden="true" />
      </summary>
      <div className="fy-skus">
        {receipt.lines.map((line) => (
          <div className="fy-sku" key={line.rowNumber}>
            <span>{skuLabel(line.itemName, line.categoryL2, line.categoryL1)}</span>
            <span>{formatSignedAmount(receipt.type, line.amount)}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

function receiptDetail(receipt: Receipt): string {
  const parts = [formatDay(receipt.date)];
  if (receipt.notes) parts.push(receipt.notes);
  if (receipt.lines.length > 1) parts.push(`${receipt.lines.length} items`);
  return parts.join(" · ");
}

function skuLabel(item: string, l2: string, l1: string): string {
  const name = item || l1;
  return l2 ? `${name} · ${l2}` : name;
}
