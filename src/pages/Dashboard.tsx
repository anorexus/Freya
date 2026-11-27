import { formatSynced } from "../domain/money";
import type { NewTransaction, ParsedRow } from "../domain/types";
import { issueSummary, useLedger } from "../state/LedgerContext";
import { Dashboard as LibraryDashboard } from "../../library/src/components/Dashboard.jsx";
import "../../library/src/tokens.css";

export type LibraryDraft = {
  type: string;
  amount: string;
  name: string;
  categoryL1: string;
  categoryL2: string;
  date: string;
  notes: string;
};

export function Dashboard({ onMenu = () => {} }: { onMenu?: () => void }) {
  const ledger = useLedger();
  const summary = issueSummary(ledger.issues);
  const notice = ledger.authError
    ? { title: "Sync needs attention.", detail: ledger.authError }
    : summary
      ? { title: summary.title, detail: summary.detail }
      : ledger.schema.ok
        ? null
        : { title: "Sheet needs repair.", detail: ledger.schema.message ?? "Headers need repair." };

  return (
    <LibraryDashboard
      onMenu={onMenu}
      transactions={ledger.rows.map(toLibraryRow)}
      wallets={walletsFrom(ledger.rows)}
      syncedLabel={`Synced ${formatSynced(ledger.syncedAt)}`}
      onSync={ledger.sync}
      syncDisabled={ledger.busy}
      notice={notice}
      onSeeMore={() => ledger.setView("transactions")}
      onSave={(draft: LibraryDraft) => saveDraft(ledger.addTransaction, draft)}
      addDisabled={!ledger.schema.ok || ledger.busy}
    />
  );
}

export function toLibraryRow(row: ParsedRow) {
  const [year, month, day] = row.date.split("-").map(Number);
  return {
    date: new Date(year, (month ?? 1) - 1, day ?? 1),
    type: row.type,
    amount: row.amount,
    category_l1: row.categoryL1,
    wallet_id: row.walletId || "cash",
    note: row.itemName || row.notes,
  };
}

export function walletsFrom(rows: ParsedRow[]) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const id = row.walletId || "cash";
    const sign = row.type === "EXPENSE" ? -1 : row.type === "INCOME" ? 1 : 0;
    totals.set(id, (totals.get(id) ?? 0) + sign * row.amount);
  }
  if (totals.size === 0) totals.set("cash", 0);
  return [...totals.entries()].map(([id, balance]) => ({
    id,
    name: walletName(id),
    balance,
  }));
}

function walletName(id: string) {
  if (id === "bca") return "BCA";
  if (id === "gopay") return "GoPay";
  if (id === "cash") return "Main Cash";
  return id;
}

export function saveDraft(addTransaction: (input: NewTransaction) => void, draft: LibraryDraft) {
  if (draft.type !== "INCOME" && draft.type !== "EXPENSE") return;
  const amount = Number(draft.amount);
  if (!Number.isFinite(amount) || amount <= 0) return;
  addTransaction({
    date: draft.date,
    type: draft.type,
    notes: draft.notes || draft.name,
    lines: [
      {
        amount,
        categoryL1: draft.categoryL1,
        categoryL2: draft.categoryL2,
        itemName: draft.name || draft.categoryL1,
      },
    ],
  });
}
