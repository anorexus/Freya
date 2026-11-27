import { useEffect, useState } from "react";
import { Categories } from "./pages/Categories";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { LogDialog } from "./components/LogDialog";
import { Shell } from "./components/Shell";
import { Sidebar as LibrarySidebar } from "../library/src/components/Sidebar.jsx";
import { DesignSystem } from "../library/src/components/DesignSystem.jsx";
import "../library/src/tokens.css";

const Sidebar = LibrarySidebar as (props: {
  page?: string;
  mobileOpen?: boolean;
  onClose?: () => void;
  onNavigate?: (id: string) => void;
}) => ReturnType<typeof LibrarySidebar>;
import { LedgerProvider, useLedger } from "./state/LedgerContext";

export function App() {
  return (
    <LedgerProvider>
      <Frame />
      <LogDialog />
    </LedgerProvider>
  );
}

function Frame() {
  const ledger = useLedger();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const library = ledger.view === "dashboard" || ledger.view === "transactions" || ledger.view === "system";
    document.documentElement.classList.toggle("is-library", library);
    return () => document.documentElement.classList.remove("is-library");
  }, [ledger.view]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    function onResize() {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  if (ledger.view === "categories") {
    return (
      <Shell>
        <PageSwitch />
      </Shell>
    );
  }

  return (
    <div className="lib-shell">
      <Sidebar
        page={ledger.view}
        mobileOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(id: string) => {
          if (id === "dashboard" || id === "transactions" || id === "categories" || id === "system") ledger.setView(id);
          setMenuOpen(false);
        }}
      />
      {ledger.view === "transactions" ? (
        <Transactions onMenu={() => setMenuOpen(true)} />
      ) : ledger.view === "system" ? (
        <DesignSystem onMenu={() => setMenuOpen(true)} />
      ) : (
        <Dashboard onMenu={() => setMenuOpen(true)} />
      )}
    </div>
  );
}

function PageSwitch() {
  const { view } = useLedger();
  if (view === "transactions") return <Transactions />;
  if (view === "categories") return <Categories />;
  return <Dashboard />;
}
