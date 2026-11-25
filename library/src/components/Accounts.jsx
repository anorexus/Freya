import { useMemo, useState } from "react";
import walletIcon from "../assets/icons/wallet.svg?raw";
import { formatRupiah, formatSignedRupiah } from "../money.js";
import { Button, buttonIcons } from "./Button.jsx";
import "./Dashboard.css";
import "./Accounts.css";

const ACCOUNTS = [
  { id: "bca", name: "BCA", type: "Account", balance: 12400000, change: 420000, color: "var(--green-40)" },
  { id: "car", name: "Car Maintenance", type: "Account", balance: 2505428, change: -180000, color: "var(--blue-40)" },
  { id: "cash", name: "Cash", type: "Account", balance: 60000, change: -15000, color: "var(--neutral-50)" },
  { id: "card", name: "Credit Card", type: "Account", balance: -405833, change: 90000, color: "var(--red-40)" },
  { id: "flexi", name: "Flexi Saver", type: "Account", balance: 37052565, change: 1250000, color: "var(--green-30)" },
  { id: "gopay", name: "GoPay", type: "Account", balance: 521163, change: -42000, color: "var(--red-30)" },
  { id: "green", name: "Green Card", type: "Account", balance: 706186, change: 28000, color: "var(--pink-40)" },
  { id: "jenius", name: "Jenius", type: "Account", balance: 3305, change: -1200, color: "var(--purple-40)" },
  { id: "ovo", name: "OVO", type: "Account", balance: 13364, change: 4000, color: "var(--deeppurple-40)" },
];

const RANGES = ["7D", "1M", "1Y", "MAX"];

const SERIES = {
  "7D": [0.96, 0.97, 0.965, 0.98, 0.972, 0.99, 1],
  "1M": [0.91, 0.93, 0.9, 0.94, 0.92, 0.96, 0.95, 0.98, 0.97, 1],
  "1Y": [0.72, 0.78, 0.75, 0.82, 0.8, 0.86, 0.84, 0.9, 0.88, 0.94, 0.96, 1],
  MAX: [0.4, 0.48, 0.45, 0.55, 0.62, 0.58, 0.7, 0.74, 0.8, 0.86, 0.92, 1],
};

function wealthPath(values, width, height) {
  const step = width / (values.length - 1);
  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - value * (height - 8) - 4;
    return [x, y];
  });
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  return { line, area };
}

export function Accounts({ onMenu = () => {} }) {
  const [range, setRange] = useState("1M");
  const total = ACCOUNTS.reduce((sum, account) => sum + account.balance, 0);
  const positive = ACCOUNTS.filter((account) => account.balance > 0);
  const positiveSum = positive.reduce((sum, account) => sum + account.balance, 0);
  const chart = useMemo(() => wealthPath(SERIES[range], 640, 160), [range]);
  const top = [...positive].sort((a, b) => b.balance - a.balance).slice(0, 6);
  const rest = positiveSum - top.reduce((sum, account) => sum + account.balance, 0);

  return (
    <main className="dash acct-screen">
      <header className="dash-bar">
        <Button className="dash-menu" variant="secondary" iconOnly icon={buttonIcons.menu} aria-label="Open menu" onClick={onMenu} />
        <h1 className="dash-title">
          <span className="dash-title-icon" dangerouslySetInnerHTML={{ __html: walletIcon }} />
          Accounts
        </h1>
        <div className="dash-actions">
          <Button className="dash-add" variant="primary" icon={buttonIcons.add}>Add account</Button>
        </div>
      </header>
      <div className="dash-content">
        <section className="acct-hero" aria-label="Wealth">
          <article className="acct-card">
            <p className="acct-total">{formatRupiah(total)}</p>
            <p className="acct-caption">Total wealth · Last 30 days</p>
            <svg className="acct-chart" viewBox="0 0 640 160" preserveAspectRatio="none" role="img" aria-label="Wealth over time">
              <defs>
                <linearGradient id="acct-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--green-40)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--green-40)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={chart.area} fill="url(#acct-fill)" />
              <path d={chart.line} fill="none" stroke="var(--green-40)" strokeWidth="2" />
            </svg>
            <div className="acct-ranges" role="group" aria-label="Range">
              {RANGES.map((item) => (
                <button key={item} type="button" className={item === range ? "is-active" : undefined} aria-pressed={item === range} onClick={() => setRange(item)}>
                  {item}
                </button>
              ))}
            </div>
          </article>
          <article className="acct-card">
            <h2>Wealth breakdown</h2>
            <div className="acct-bar" aria-hidden="true">
              {top.map((account) => (
                <span key={account.id} style={{ width: `${(account.balance / positiveSum) * 100}%`, background: account.color }} />
              ))}
              {rest > 0 ? <span style={{ width: `${(rest / positiveSum) * 100}%`, background: "var(--neutral-60)" }} /> : null}
            </div>
            <ul className="acct-legend">
              {top.map((account) => (
                <li key={account.id}>
                  <span className="acct-swatch" style={{ background: account.color }} />
                  <span>{account.name}</span>
                  <span>{((account.balance / positiveSum) * 100).toFixed(1)}%</span>
                </li>
              ))}
              {rest > 0 ? (
                <li>
                  <span className="acct-swatch" style={{ background: "var(--neutral-60)" }} />
                  <span>+ {positive.length - top.length}</span>
                  <span>{((rest / positiveSum) * 100).toFixed(1)}%</span>
                </li>
              ) : null}
            </ul>
          </article>
        </section>
        <section className="acct-list" aria-label="Accounts">
          <header>
            <h2>Accounts</h2>
            <p>{formatRupiah(total)}</p>
          </header>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Change · 1M</th>
              </tr>
            </thead>
            <tbody>
              {ACCOUNTS.map((account) => (
                <tr key={account.id}>
                  <td>{account.name}</td>
                  <td>{account.type}</td>
                  <td className={account.balance < 0 ? "is-negative" : undefined}>{formatRupiah(account.balance)}</td>
                  <td className={account.change < 0 ? "is-negative" : "is-positive"}>{formatSignedRupiah(account.change)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
