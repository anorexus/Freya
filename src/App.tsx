import { Categories } from "./pages/Categories";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { LogDialog } from "./components/LogDialog";
import { Shell } from "./components/Shell";
import { LedgerProvider, useLedger } from "./state/LedgerContext";

export function App() {
  return (
    <LedgerProvider>
      <Shell>
        <PageSwitch />
      </Shell>
      <LogDialog />
    </LedgerProvider>
  );
}

function PageSwitch() {
  const { view } = useLedger();
  if (view === "transactions") return <Transactions />;
  if (view === "categories") return <Categories />;
  return <Dashboard />;
}
