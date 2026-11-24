import { useCallback, useEffect, useState } from "react";
import { Dashboard } from "./components/Dashboard.jsx";
import { DesignSystem } from "./components/DesignSystem.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import "./tokens.css";
import "./app.css";

const PAGES = new Set(["dashboard", "transactions", "wallets", "categories", "settings", "system"]);

function readPage() {
  const id = window.location.hash.replace(/^#/, "");
  if (id === "library") return "system";
  return PAGES.has(id) ? id : "dashboard";
}

export default function App() {
  const [page, setPage] = useState(readPage);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function sync() {
      setPage(readPage());
    }
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    function onResize() {
      if (window.innerWidth > 720) setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const navigate = useCallback((id) => {
    const next = id === "dashboard" ? "#dashboard" : `#${id}`;
    if (window.location.hash !== next) window.history.pushState(null, "", next);
    setPage(id);
    setMenuOpen(false);
  }, []);

  return (
    <div className="lib-shell">
      <Sidebar page={page} onNavigate={navigate} mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      {page === "system" ? <DesignSystem onMenu={() => setMenuOpen(true)} /> : <Dashboard onMenu={() => setMenuOpen(true)} />}
    </div>
  );
}
