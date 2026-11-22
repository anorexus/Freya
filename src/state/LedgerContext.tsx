import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { buildSeed } from "../domain/seed";
import { todayISO } from "../domain/money";
import type { NewTransaction, ParsedRow, RowIssue } from "../domain/types";
import type { SchemaCheck } from "../domain/contract";
import { loadSnapshot, readStored, replaceLedger, saveTransaction, snapshotFrom, type LedgerSnapshot } from "../data/localLedger";

export type AppView = "dashboard" | "transactions" | "categories";

type LedgerState = LedgerSnapshot & {
  storedCount: number;
  query: string;
  view: AppView;
  logOpen: boolean;
  setQuery: (query: string) => void;
  setView: (view: AppView) => void;
  setLogOpen: (open: boolean) => void;
  sync: () => void;
  addTransaction: (input: NewTransaction) => void;
  clearLedger: () => void;
  loadSample: () => void;
};

const LedgerContext = createContext<LedgerState | null>(null);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<LedgerSnapshot>(() => loadSnapshot());
  const [query, setQuery] = useState("");
  const [view, setView] = useState<AppView>("dashboard");
  const [logOpen, setLogOpen] = useState(false);

  const api = useMemo<LedgerState>(() => {
    return {
      ...snapshot,
      storedCount: readStored().rows.length,
      query,
      view,
      logOpen,
      setQuery,
      setView,
      setLogOpen,
      sync: () => {
        const stored = readStored();
        setSnapshot(snapshotFrom(stored.rows, stored.sample));
      },
      addTransaction: (input: NewTransaction) => {
        const stored = readStored();
        const next = saveTransaction(stored.rows, input);
        setSnapshot(snapshotFrom(next, false));
        setView("dashboard");
        setLogOpen(false);
      },
      clearLedger: () => {
        replaceLedger([], false);
        setSnapshot(snapshotFrom([], false));
      },
      loadSample: () => {
        const seeded = buildSeed(todayISO());
        replaceLedger(seeded, true);
        setSnapshot(snapshotFrom(seeded, true));
        setView("dashboard");
      },
    };
  }, [snapshot, query, view, logOpen]);

  return <LedgerContext.Provider value={api}>{children}</LedgerContext.Provider>;
}

export function useLedger(): LedgerState {
  const value = useContext(LedgerContext);
  if (!value) throw new Error("useLedger must be used inside LedgerProvider");
  return value;
}

export function issueSummary(issues: RowIssue[]): { title: string; detail: string } | null {
  if (issues.length === 0) return null;
  if (issues.length === 1) {
    const issue = issues[0];
    const reason = issue.reasons.includes("invalid amount") ? "Invalid amount." : `Invalid ${issue.reasons[0].replace(/^invalid /, "")}.`;
    return {
      title: `Row ${issue.rowNumber} excluded.`,
      detail: `${reason} Fix it in the sheet, then sync. Logging stays available.`,
    };
  }
  const listed = issues
    .slice(0, 3)
    .map((issue) => issue.rowNumber)
    .join(", ");
  return {
    title: `${issues.length} rows excluded.`,
    detail: `Rows ${listed} were left out of totals. Fix them in the sheet, then sync. Logging stays available.`,
  };
}

export function schemaBanner(schema: SchemaCheck): string | null {
  return schema.ok ? null : schema.message;
}

export type { ParsedRow };
