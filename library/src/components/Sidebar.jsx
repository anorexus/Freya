import { useState } from "react";
import avatar from "../assets/avatar.jpg";
import logo from "../assets/nav/logo.svg?raw";
import searchIcon from "../assets/nav/search.svg?raw";
import dashboardIcon from "../assets/nav/dashboard.svg?raw";
import transactionsIcon from "../assets/nav/transactions.svg?raw";
import walletIcon from "../assets/nav/wallet.svg?raw";
import categoryIcon from "../assets/nav/category.svg?raw";
import settingsIcon from "../assets/nav/settings.svg?raw";
import chevronIcon from "../assets/nav/chevron.svg?raw";
import "./Sidebar.css";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: dashboardIcon },
  { id: "transactions", label: "Transactions", icon: transactionsIcon },
  { id: "wallets", label: "Wallets", icon: walletIcon },
  { id: "categories", label: "Categories", icon: categoryIcon },
  { id: "settings", label: "Settings", icon: settingsIcon },
];

function Icon({ svg }) {
  return <span className="side-icon" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Sidebar() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("dashboard");
  const [accountOpen, setAccountOpen] = useState(false);
  const items = NAV.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <aside className="side">
      <div className="side-logo">
        <Icon svg={logo} />
        <p>Freya</p>
      </div>
      <label className="side-search">
        <Icon svg={searchIcon} />
        <input
          type="search"
          value={query}
          placeholder="Search"
          aria-label="Search"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <nav className="side-nav" aria-label="Primary">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === active ? "is-active" : undefined}
            aria-current={item.id === active ? "page" : undefined}
            onClick={() => setActive(item.id)}
          >
            <Icon svg={item.icon} />
            {item.label}
          </button>
        ))}
        {items.length === 0 && <p className="side-empty">No matches</p>}
      </nav>
      <div className="side-spacer" />
      {accountOpen && (
        <div className="side-menu" role="region" aria-label="Account">
          <p>Armas Nurbahari Sanubari</p>
          <p>armasnurbahari2423@gmail.com</p>
        </div>
      )}
      <div className="side-profile">
        <img src={avatar} alt="" width="40" height="40" />
        <div>
          <p>Armas Nurbahari Sanubari</p>
          <p>armasnurbahari2423@gmail.com</p>
        </div>
        <button
          type="button"
          aria-label={accountOpen ? "Hide account" : "Show account"}
          aria-expanded={accountOpen}
          onClick={() => setAccountOpen((open) => !open)}
        >
          <Icon svg={chevronIcon} />
        </button>
      </div>
    </aside>
  );
}
