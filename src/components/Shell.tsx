import { useEffect, type ReactNode } from "react";
import { sheetUrl } from "../data/googleSheet";
import { formatSynced } from "../domain/money";
import { useLedger, type AppView } from "../state/LedgerContext";
import { IconClock, IconDashboard, IconList, IconSearch, IconTrend } from "./Icons";

const NAV: { id: AppView; label: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <IconDashboard /> },
  { id: "transactions", label: "Transactions", icon: <IconList /> },
  { id: "categories", label: "Categories", icon: <IconTrend /> },
];

export function Shell({ children }: { children: ReactNode }) {
  const ledger = useLedger();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
      event.preventDefault();
      document.getElementById("fy-search")?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const crumb = NAV.find((item) => item.id === ledger.view)?.label ?? "Dashboard";

  return (
    <div className="fy-app">
      <div className="fy-shell">
        <aside className="fy-sidebar">
          <div className="fy-brand">
            <span className="fy-mark" aria-hidden="true" />
            <span className="fy-brand-name">Freya</span>
          </div>
          <label className="fy-search">
            <IconSearch />
            <input
              id="fy-search"
              type="search"
              placeholder="Search"
              aria-label="Search transactions"
              value={ledger.query}
              onChange={(event) => ledger.setQuery(event.target.value)}
            />
            <span className="fy-kbd">/</span>
          </label>
          <nav className="fy-nav" aria-label="Primary">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={ledger.view === item.id ? "fy-nav-item is-active" : "fy-nav-item"}
                type="button"
                aria-current={ledger.view === item.id ? "page" : undefined}
                onClick={() => ledger.setView(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <div className="fy-sidebar-foot">
            <strong>{ledger.sheet ? "Sheet connected" : ledger.isSample ? "Sample ledger" : "Local ledger"}</strong>
            {ledger.sheet
              ? [ledger.sheet.title, ledger.session?.email, ledger.schema.ok ? "headers match the M1 contract" : "headers need repair"]
                  .filter(Boolean)
                  .join(" · ")
              : ledger.schema.ok
                ? "Headers match the M1 contract"
                : "Sheet contract is broken"}
          </div>
          {ledger.authError ? <p className="fy-help is-error">{ledger.authError}</p> : null}
          {ledger.session ? (
            <button className="fy-btn fy-btn-ghost fy-sidebar-action" type="button" onClick={ledger.signOut} disabled={ledger.busy}>
              Sign out
            </button>
          ) : (
            <button className="fy-btn fy-btn-secondary fy-sidebar-action" type="button" onClick={ledger.signIn} disabled={ledger.busy}>
              Sign in with Google
            </button>
          )}
          {ledger.session && !ledger.sheet ? (
            <button className="fy-btn fy-btn-primary fy-sidebar-action" type="button" onClick={ledger.createSheet} disabled={ledger.busy}>
              Create Freya sheet
            </button>
          ) : null}
          {ledger.sheet ? (
            <a className="fy-btn fy-btn-ghost fy-sidebar-action" href={sheetUrl(ledger.sheet.id)} target="_blank" rel="noreferrer">
              Open sheet
            </a>
          ) : null}
          {!ledger.sheet && (ledger.rows.length > 0 || ledger.issues.length > 0) ? (
            <button className="fy-btn fy-btn-ghost fy-sidebar-action" type="button" onClick={ledger.clearLedger}>
              Clear ledger
            </button>
          ) : null}
          {!ledger.sheet && ledger.rows.length === 0 && ledger.issues.length === 0 ? (
            <button className="fy-btn fy-btn-ghost fy-sidebar-action" type="button" onClick={ledger.loadSample}>
              Load sample
            </button>
          ) : null}
        </aside>
        <main className="fy-main">
          <div className="fy-topbar">
            <div className="fy-crumb">
              <IconClock />
              {crumb}
            </div>
            <div className="fy-actions">
              <span>Synced {formatSynced(ledger.syncedAt)}</span>
              <button className="fy-btn fy-btn-secondary" type="button" onClick={ledger.sync} disabled={ledger.busy}>
                Sync
              </button>
              <button className="fy-btn fy-btn-primary" type="button" disabled={!ledger.schema.ok || ledger.busy} onClick={() => ledger.setLogOpen(true)}>
                Log transaction
              </button>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
