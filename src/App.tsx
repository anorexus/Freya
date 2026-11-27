import { useEffect, useState } from "react";
import { Categories } from "./pages/Categories";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { LogDialog } from "./components/LogDialog";
import { Shell } from "./components/Shell";
import { Sidebar as LibrarySidebar } from "../library/src/components/Sidebar.jsx";
import { DesignSystem } from "../library/src/components/DesignSystem.jsx";
import { AuthCard } from "../library/src/components/AuthCard.jsx";
import "../library/src/tokens.css";

const Sidebar = LibrarySidebar as (props: {
  page?: string;
  mobileOpen?: boolean;
  onClose?: () => void;
  onNavigate?: (id: string) => void;
  onLogIn?: () => void;
  onSignOut?: () => void;
  loginDisabled?: boolean;
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
  const inside = ledger.gate === "simulation" || ledger.gate === "app";

  useEffect(() => {
    const library = inside && (ledger.view === "dashboard" || ledger.view === "transactions" || ledger.view === "system");
    document.documentElement.classList.toggle("is-library", library);
    return () => document.documentElement.classList.remove("is-library");
  }, [inside, ledger.view]);

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

  if (ledger.gate === "login" || ledger.gate === "opening") {
    return (
      <AuthCard
        title="Freya"
        copy="Freya keeps the ledger in a Google Sheet. Simulation stays in this browser."
        error={ledger.authError}
        primary={ledger.gate === "opening" && !ledger.authError ? "Opening your ledger…" : "Login with Google"}
        onPrimary={ledger.signIn}
        primaryDisabled={ledger.busy || (ledger.gate === "opening" && !ledger.authError)}
        secondary={ledger.gate === "login" ? "Try simulation" : undefined}
        onSecondary={ledger.enterSimulation}
        onSignOut={ledger.gate === "opening" ? ledger.signOut : undefined}
      />
    );
  }

  if (ledger.gate === "create") {
    return (
      <AuthCard
        title="Create your ledger"
        copy="Freya makes a Google Sheet with the transaction tabs. You can edit rows there, and Freya reads them back."
        error={ledger.authError}
        primary={ledger.busy ? "Creating ledger…" : "Create ledger"}
        onPrimary={ledger.createSheet}
        primaryDisabled={ledger.busy}
        onSignOut={ledger.signOut}
      />
    );
  }

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
        onLogIn={ledger.session ? undefined : ledger.signIn}
        onSignOut={ledger.session || ledger.gate === "simulation" ? ledger.signOut : undefined}
        loginDisabled={ledger.busy}
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
