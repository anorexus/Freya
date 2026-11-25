import { useEffect, useRef, useState } from "react";
import avatar from "../assets/avatar.jpg";
import logomark from "../assets/nav/logomark.svg";
import wordmark from "../assets/nav/wordmark.svg";
import collapseIcon from "../assets/nav/collapse.svg?raw";
import chevronIcon from "../assets/nav/chevron.svg?raw";
import searchIcon from "../assets/icons/search.svg?raw";
import dashboardIcon from "../assets/icons/dashboard.svg?raw";
import transactionsIcon from "../assets/icons/transactions.svg?raw";
import walletIcon from "../assets/icons/wallet.svg?raw";
import categoryIcon from "../assets/icons/category.svg?raw";
import settingsIcon from "../assets/icons/settings.svg?raw";
import systemIcon from "../assets/icons/system.svg?raw";
import "./Sidebar.css";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: dashboardIcon, key: "D" },
  { id: "transactions", label: "Transactions", icon: transactionsIcon, key: "T" },
  { id: "wallets", label: "Wallets", icon: walletIcon, key: "W" },
  { id: "categories", label: "Categories", icon: categoryIcon, key: "C" },
  { id: "settings", label: "Settings", icon: settingsIcon, key: "S" },
  { id: "system", label: "Design system", icon: systemIcon, key: "Y" },
];

function Icon({ svg }) {
  return <span className="side-icon" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Sidebar({ page = "dashboard", onNavigate = () => {}, mobileOpen = false, onClose = () => {} }) {
  const [query, setQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const searchRef = useRef(null);
  const items = NAV.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    function onKey(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      const typing = target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (typing) return;
      const item = NAV.find((entry) => entry.key.toLowerCase() === event.key.toLowerCase());
      if (!item) return;
      event.preventDefault();
      onNavigate(item.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNavigate]);

  return (
    <>
    {mobileOpen ? <button type="button" className="side-backdrop" aria-label="Close menu" onClick={onClose} /> : null}
    <aside className={`${collapsed ? "side is-collapsed" : "side"}${mobileOpen ? " is-drawer" : ""}`}>
      <div className="side-logo">
        <button
          type="button"
          className="side-brand"
          aria-label={collapsed ? "Expand sidebar" : "Dashboard"}
          onClick={() => {
            const mobile = window.matchMedia("(width < 1024px)").matches;
            if (collapsed && !mobile) setCollapsed(false);
            else onNavigate("dashboard");
          }}
        >
          <span className="side-mark">
            <span className="side-mark-spin">
              <img src={logomark} alt="" />
            </span>
          </span>
          <span className="side-word">
            <img src={wordmark} alt="" />
          </span>
        </button>
        <button
          type="button"
          className="side-key side-collapse"
          aria-label="Collapse sidebar"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed(true)}
        >
          <Icon svg={collapseIcon} />
        </button>
      </div>
      <label className="side-search">
        <Icon svg={searchIcon} />
        <input
          ref={searchRef}
          type="search"
          value={query}
          placeholder="Search"
          aria-label="Search"
          aria-keyshortcuts="/"
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className="side-key" aria-hidden="true">/</span>
      </label>
      <nav className="side-nav" aria-label="Primary">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === page ? "is-active" : undefined}
            aria-current={item.id === page ? "page" : undefined}
            aria-label={item.label}
            aria-keyshortcuts={item.key}
            onClick={() => onNavigate(item.id)}
          >
            <Icon svg={item.icon} />
            <span className="side-label">{item.label}</span>
            <span className="side-key" aria-hidden="true">{item.key}</span>
          </button>
        ))}
        {items.length === 0 && <p className="side-empty">No matches</p>}
      </nav>
      <div className="side-spacer" />
      {accountOpen && !collapsed && (
        <div className="side-menu" role="region" aria-label="Account">
          <p>Armas Nurbahari Sanubari</p>
          <p>armasnurbahari2423@gmail.com</p>
        </div>
      )}
      <button
        type="button"
        className={accountOpen ? "side-profile is-selected" : "side-profile"}
        aria-label={accountOpen ? "Hide account" : "Show account"}
        aria-expanded={accountOpen}
        onClick={() => setAccountOpen((open) => !open)}
      >
        <img src={avatar} alt="" width="32" height="32" />
        <span className="side-person">
          <p>Armas Nurbahari Sanubari</p>
          <p>armasnurbahari2423@gmail.com</p>
        </span>
        <span className="side-key" aria-hidden="true">
          <Icon svg={chevronIcon} />
        </span>
      </button>
    </aside>
    </>
  );
}
