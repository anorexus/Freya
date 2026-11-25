import { useEffect, useId, useState } from "react";
import { CATEGORIES } from "../../../src/data/categories.ts";
import { Button, buttonIcons } from "./Button.jsx";
import "./Notification.css";
import "./AddTransactionCard.css";

const TYPES = [
  { id: "EXPENSE", label: "Expense" },
  { id: "INCOME", label: "Income" },
  { id: "TRANSFER", label: "Transfer" },
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function nowLocalValue() {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function categoriesFor(type) {
  return CATEGORIES.filter((category) => category.type === type);
}

function blank(wallets) {
  const from = wallets[0]?.id ?? "";
  const to = wallets.find((wallet) => wallet.id !== from)?.id ?? "";
  return {
    date: nowLocalValue(),
    amount: "",
    type: "EXPENSE",
    name: "",
    notes: "",
    category: categoriesFor("EXPENSE")[0]?.l1 ?? "",
    fromWallet: from,
    toWallet: to,
  };
}

export function AddTransactionCard({ open, wallets, onClose }) {
  const titleId = useId();
  const [draft, setDraft] = useState(() => blank(wallets));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    setDraft(blank(wallets));
    setError("");
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, wallets, onClose]);

  if (!open) return null;

  const isTransfer = draft.type === "TRANSFER";
  const categories = categoriesFor(draft.type);
  const destinations = wallets.filter((wallet) => wallet.id !== draft.fromWallet);

  function patch(next) {
    setDraft((current) => ({ ...current, ...next }));
    setError("");
  }

  function changeType(type) {
    const nextCategories = categoriesFor(type);
    patch({
      type,
      category: nextCategories[0]?.l1 ?? "",
    });
  }

  function onSubmit(event) {
    event.preventDefault();
    const amount = Number(String(draft.amount).replace(/,/g, ""));
    if (!draft.date) {
      setError("Choose a date and time.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Amount has to be greater than zero.");
      return;
    }
    if (!draft.name.trim()) {
      setError("Name the transaction.");
      return;
    }
    if (!draft.fromWallet) {
      setError("Choose an account.");
      return;
    }
    if (isTransfer && (!draft.toWallet || draft.toWallet === draft.fromWallet)) {
      setError("Choose a different account to transfer into.");
      return;
    }
    if (!isTransfer && !draft.category) {
      setError("Choose a category.");
      return;
    }
    onClose();
  }

  return (
    <div className="log-overlay" onMouseDown={onClose}>
      <form
        className="log-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
      >
        <header className="log-head">
          <h2 id={titleId}>Add transaction</h2>
          <button type="button" className="note-close log-close" aria-label="Close" onClick={onClose}>
            <span className="fy-glyph" dangerouslySetInnerHTML={{ __html: buttonIcons.close }} />
          </button>
        </header>
        <div className="log-body">
          <label className="log-field">
            <span>Date</span>
            <input type="datetime-local" value={draft.date} onChange={(event) => patch({ date: event.target.value })} required />
          </label>
          <label className="log-field">
            <span>Amount</span>
            <span className="log-amount">
              <b>Rp</b>
              <input
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                value={draft.amount}
                onChange={(event) => patch({ amount: event.target.value })}
              />
            </span>
          </label>
          <fieldset className="log-field">
            <legend>Type</legend>
            <div className="log-types" role="radiogroup" aria-label="Type">
              {TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  role="radio"
                  aria-checked={draft.type === type.id}
                  className={draft.type === type.id ? "is-selected" : ""}
                  onClick={() => changeType(type.id)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="log-field">
            <span>{isTransfer ? "From account" : "Account"}</span>
            <select value={draft.fromWallet} onChange={(event) => patch({ fromWallet: event.target.value })}>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </select>
          </label>
          {isTransfer ? (
            <label className="log-field">
              <span>To account</span>
              <select value={draft.toWallet} onChange={(event) => patch({ toWallet: event.target.value })}>
                {destinations.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="log-field">
            <span>Transaction name</span>
            <input
              type="text"
              autoComplete="off"
              placeholder={isTransfer ? "Move to cash" : "Groceries"}
              value={draft.name}
              onChange={(event) => patch({ name: event.target.value })}
            />
          </label>
          <label className="log-field">
            <span>
              Notes <em>optional</em>
            </span>
            <textarea rows={3} value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} />
          </label>
          {isTransfer ? null : (
            <label className="log-field">
              <span>Category</span>
              <select value={draft.category} onChange={(event) => patch({ category: event.target.value })}>
                {categories.map((category) => (
                  <option key={category.l1} value={category.l1}>
                    {category.l1}
                  </option>
                ))}
              </select>
            </label>
          )}
          {error ? <p className="log-error">{error}</p> : null}
        </div>
        <footer className="log-foot">
          <Button variant="primary" icon={buttonIcons.add} type="submit">
            Add transaction
          </Button>
        </footer>
      </form>
    </div>
  );
}
