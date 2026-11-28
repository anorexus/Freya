import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearSession, readSession, signInWithGoogle, tokenIncludesDriveFile, type GoogleSession } from "../auth/google";
import { buildSeed } from "../domain/seed";
import { todayISO } from "../domain/money";
import type { NewTransaction, RowIssue } from "../domain/types";
import type { SchemaCheck } from "../domain/contract";
import { appendTransactions, clearSheetLink, createFreyaSheet, listFreyaLedgers, readFreyaSheet, readSheetLink, stampFreyaLedger, transactionRows, writeSheetLink, type LedgerCandidate, type SheetLink } from "../data/googleSheet";
import { loadSnapshot, readStored, replaceLedger, saveTransaction, snapshotFrom, snapshotFromGrid, type LedgerSnapshot } from "../data/localLedger";

export type AppView = "dashboard" | "transactions" | "categories" | "system";
export type Gate = "login" | "simulation" | "opening" | "create" | "choose" | "app";

type LedgerState = LedgerSnapshot & {
  storedCount: number;
  query: string;
  view: AppView;
  logOpen: boolean;
  busy: boolean;
  authError: string | null;
  session: GoogleSession | null;
  sheet: SheetLink | null;
  gate: Gate;
  choices: LedgerCandidate[];
  setQuery: (query: string) => void;
  setView: (view: AppView) => void;
  setLogOpen: (open: boolean) => void;
  sync: () => void;
  addTransaction: (input: NewTransaction) => void;
  clearLedger: () => void;
  loadSample: () => void;
  signIn: () => void;
  signOut: () => void;
  enterSimulation: () => void;
  createSheet: () => void;
  openChoice: (id: string) => void;
};

const LedgerContext = createContext<LedgerState | null>(null);

function initialGate(): Gate {
  return readSession() ? "opening" : "login";
}

function sheetGone(error: unknown): boolean {
  const status = (error as { status?: number }).status;
  return status === 403 || status === 404;
}

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<SheetLink | null>(null);
  const [session, setSession] = useState<GoogleSession | null>(() => readSession());
  const [snapshot, setSnapshot] = useState<LedgerSnapshot>(() => loadSnapshot());
  const [query, setQuery] = useState("");
  const [view, setView] = useState<AppView>("dashboard");
  const [logOpen, setLogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [gate, setGate] = useState<Gate>(initialGate);
  const [choices, setChoices] = useState<LedgerCandidate[]>([]);

  async function pullSheet(accessToken: string, link: SheetLink) {
    const grid = await readFreyaSheet(accessToken, link.id);
    const nextLink = { id: link.id, title: grid.title };
    writeSheetLink(nextLink);
    setSheet(nextLink);
    setSnapshot(snapshotFromGrid(grid.headers, grid.dataRows, grid.tabs, false, grid.categoryHeaders, grid.categoryRows));
    void stampFreyaLedger(accessToken, link.id).catch(() => undefined);
  }

  async function discoverLedgers(accessToken: string) {
    const found = await listFreyaLedgers(accessToken);
    if (found.length === 1) {
      await pullSheet(accessToken, found[0]);
      setView("dashboard");
      setGate("app");
      return;
    }
    setChoices(found);
    setGate(found.length === 0 ? "create" : "choose");
  }

  async function resumeLedger(accessToken: string) {
    const linked = readSheetLink();
    if (linked) {
      try {
        await pullSheet(accessToken, linked);
        setView("dashboard");
        setGate("app");
        return;
      } catch (error: unknown) {
        if (!sheetGone(error)) throw error;
        clearSheetLink();
        setSheet(null);
      }
    }
    await discoverLedgers(accessToken);
  }

  useEffect(() => {
    const existing = readSession();
    if (!existing) return;
    let cancelled = false;
    setBusy(true);
    setGate("opening");
    resumeLedger(existing.accessToken)
      .catch((error: unknown) => {
        if (!cancelled) setAuthError(error instanceof Error ? error.message : "Could not read the sheet.");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
    // Resume a tab session before any dashboard render. Closing the tab drops sessionStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const api = useMemo<LedgerState>(() => {
    return {
      ...snapshot,
      storedCount: sheet ? snapshot.rows.length + snapshot.issues.length : readStored().rows.length,
      query,
      view,
      logOpen,
      busy,
      authError,
      session,
      sheet,
      gate,
      choices,
      setQuery,
      setView,
      setLogOpen,
      sync: () => {
        if (sheet) {
          if (!session) {
            setAuthError("Sign in again to sync the sheet.");
            return;
          }
          setBusy(true);
          setAuthError(null);
          pullSheet(session.accessToken, sheet)
            .catch((error: unknown) => setAuthError(error instanceof Error ? error.message : "Could not sync the sheet."))
            .finally(() => setBusy(false));
          return;
        }
        const stored = readStored();
        setSnapshot(snapshotFrom(stored.rows, stored.sample));
      },
      addTransaction: (input: NewTransaction) => {
        if (sheet) {
          if (!snapshot.schema.ok) return;
          if (!session) {
            setAuthError("Sign in again before logging.");
            return;
          }
          setBusy(true);
          setAuthError(null);
          appendTransactions(session.accessToken, sheet.id, transactionRows(input))
            .then(() => pullSheet(session.accessToken, sheet))
            .then(() => {
              setView("dashboard");
              setLogOpen(false);
            })
            .catch((error: unknown) => setAuthError(error instanceof Error ? error.message : "Could not log the transaction."))
            .finally(() => setBusy(false));
          return;
        }
        const stored = readStored();
        const next = saveTransaction(stored.rows, input);
        setSnapshot(snapshotFrom(next, false));
        setView("dashboard");
        setLogOpen(false);
      },
      clearLedger: () => {
        if (sheet) return;
        replaceLedger([], false);
        setSnapshot(snapshotFrom([], false));
      },
      loadSample: () => {
        if (sheet) return;
        const seeded = buildSeed(todayISO());
        replaceLedger(seeded, true);
        setSnapshot(snapshotFrom(seeded, true));
        setView("dashboard");
      },
      signIn: () => {
        setBusy(true);
        setAuthError(null);
        signInWithGoogle()
          .then(async (next) => {
            setSession(next);
            setGate("opening");
            await resumeLedger(next.accessToken);
          })
          .catch((error: unknown) => setAuthError(error instanceof Error ? error.message : "Google sign-in failed."))
          .finally(() => setBusy(false));
      },
      signOut: () => {
        clearSession();
        setSession(null);
        setSheet(null);
        setAuthError(null);
        setLogOpen(false);
        setSnapshot(loadSnapshot());
        setGate("login");
      },
      enterSimulation: () => {
        setSheet(null);
        setAuthError(null);
        setSnapshot(loadSnapshot());
        setView("dashboard");
        setGate("simulation");
      },
      openChoice: (id: string) => {
        if (!session) {
          setAuthError("Sign in again to open the ledger.");
          return;
        }
        const choice = choices.find((item) => item.id === id);
        if (!choice) return;
        const current = session;
        setBusy(true);
        setAuthError(null);
        setGate("opening");
        pullSheet(current.accessToken, choice)
          .then(() => {
            setView("dashboard");
            setGate("app");
          })
          .catch((error: unknown) => {
            setAuthError(error instanceof Error ? error.message : "Could not open the ledger.");
            setGate("choose");
          })
          .finally(() => setBusy(false));
      },
      createSheet: () => {
        if (!session) {
          setAuthError("Sign in before creating a sheet.");
          return;
        }
        const current = session;
        setBusy(true);
        setAuthError(null);
        void (async () => {
          try {
            let accessToken = current.accessToken;
            if (!(await tokenIncludesDriveFile(accessToken))) {
              const next = await signInWithGoogle("consent");
              setSession(next);
              accessToken = next.accessToken;
            }
            const link = await createFreyaSheet(accessToken);
            setSheet(link);
            await pullSheet(accessToken, link);
            setView("dashboard");
            setGate("app");
          } catch (error: unknown) {
            setAuthError(error instanceof Error ? error.message : "Could not create the sheet.");
          } finally {
            setBusy(false);
          }
        })();
      },
    };
  }, [snapshot, query, view, logOpen, busy, authError, session, sheet, gate, choices]);

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
