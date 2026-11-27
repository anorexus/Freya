import { formatSynced } from "../domain/money";
import { useLedger } from "../state/LedgerContext";
import { Transactions as LibraryTransactions } from "../../library/src/components/Transactions.jsx";
import { saveDraft, toLibraryRow, walletsFrom, type LibraryDraft } from "./Dashboard";

export function Transactions({ onMenu = () => {} }: { onMenu?: () => void }) {
  const ledger = useLedger();

  return (
    <LibraryTransactions
      onMenu={onMenu}
      transactions={ledger.rows.map(toLibraryRow)}
      wallets={walletsFrom(ledger.rows)}
      syncedLabel={`Synced ${formatSynced(ledger.syncedAt)}`}
      onSync={ledger.sync}
      syncDisabled={ledger.busy}
      onSave={(draft: LibraryDraft) => saveDraft(ledger.addTransaction, draft)}
      addDisabled={!ledger.schema.ok || ledger.busy}
    />
  );
}
