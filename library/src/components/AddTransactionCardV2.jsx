import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "../../../src/data/categories.ts";
import bcaMark from "../assets/wallets/bca.svg";
import cashMark from "../assets/wallets/cash.svg";
import gopayMark from "../assets/wallets/gopay.png";
import { Button, buttonIcons } from "./Button.jsx";
import "./AddTransactionCardV2.css";

const TYPES = [
  { id: "EXPENSE", label: "Expense", icon: buttonIcons.expense },
  { id: "INCOME", label: "Income", icon: buttonIcons.income },
  { id: "TRANSFER", label: "Transfer", icon: buttonIcons.transfer },
];

const PEOPLE = [
  { id: "mamoy", name: "Mamoy" },
  { id: "adi", name: "Adi" },
  { id: "rina", name: "Rina" },
];

function Glyph({ svg, className = "at2-glyph" }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function todayIso() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDate(iso) {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(digits) {
  if (!digits) return "Rp0";
  return `Rp${Number(digits).toLocaleString("en-US")}`;
}

function WalletMark({ id }) {
  if (id === "bca") {
    return (
      <span className="at2-mark is-bca">
        <img src={bcaMark} alt="" />
      </span>
    );
  }
  if (id === "gopay") {
    return (
      <span className="at2-mark is-gopay">
        <img src={gopayMark} alt="" />
      </span>
    );
  }
  return (
    <span className="at2-mark is-cash">
      <img src={cashMark} alt="" />
    </span>
  );
}

function Radio({ state = "unselected" }) {
  return (
    <span className={`at2-radio is-${state}`} aria-hidden="true">
      {state === "selected" ? <span className="at2-radio-fill" /> : null}
      {state === "partial" ? <span className="at2-radio-partial" /> : null}
    </span>
  );
}

function PersonMark({ empty = false }) {
  return (
    <span className={`at2-person${empty ? " is-empty" : ""}`} aria-hidden="true">
      <Glyph svg={buttonIcons.user} className="at2-person-icon" />
    </span>
  );
}

function freshDraft(wallets) {
  return {
    type: "EXPENSE",
    amount: "",
    name: "",
    categoryL1: "Groceries",
    categoryL2: "",
    account: wallets[0]?.id ?? "bca",
    toAccount: wallets[1]?.id ?? wallets[0]?.id ?? "",
    date: todayIso(),
    notes: "",
    people: [],
  };
}

export function AddTransactionCardV2({ open, wallets = [], onClose, onSave }) {
  const titleId = useId();
  const dialog = typeof open === "boolean";
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [page, setPage] = useState("form");
  const [accountTarget, setAccountTarget] = useState("from");
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const [draft, setDraft] = useState(() => freshDraft(wallets));

  useEffect(() => {
    if (!dialog || !open) return undefined;
    setPage("form");
    setQuery("");
    setDraft(freshDraft(wallets));
    function onKey(event) {
      if (event.key === "Escape") onCloseRef.current?.();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [dialog, open, wallets]);

  const expenseCategories = useMemo(
    () => CATEGORIES.filter((category) => category.type === (draft.type === "INCOME" ? "INCOME" : "EXPENSE")),
    [draft.type],
  );

  function patch(next) {
    setDraft((current) => ({ ...current, ...next }));
  }

  function openPicker(nextPage, target) {
    setQuery("");
    if (target) setAccountTarget(target);
    setPage(nextPage);
  }

  function back() {
    setQuery("");
    setPage("form");
  }

  const account = wallets.find((wallet) => wallet.id === draft.account) ?? wallets[0];
  const toAccount = wallets.find((wallet) => wallet.id === draft.toAccount);
  const category = expenseCategories.find((item) => item.l1 === draft.categoryL1) ?? expenseCategories[0];
  const categoryLabel = draft.categoryL2 || category?.l1 || "Uncategorized";
  const people = PEOPLE.filter((person) => draft.people.includes(person.id));
  const filteredPeople = PEOPLE.filter((person) => person.name.toLowerCase().includes(query.trim().toLowerCase()));
  const filteredWallets = wallets.filter((wallet) => wallet.name.toLowerCase().includes(query.trim().toLowerCase()));
  const filteredCategories = expenseCategories.filter((item) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return item.l1.toLowerCase().includes(needle) || item.l2.some((child) => child.toLowerCase().includes(needle));
  });

  const titles = {
    form: "Add transaction",
    category: "Select category",
    account: "Select accounts",
    beneficiary: "Select beneficiaries",
    receipt: "Receipt details",
  };

  function submit(event) {
    event.preventDefault();
    onSave?.(draft);
    if (dialog) onClose?.();
  }

  if (dialog && !open) return null;

  const card = (
    <form
      className="at2"
      role={dialog ? "dialog" : undefined}
      aria-modal={dialog ? "true" : undefined}
      aria-labelledby={titleId}
      onSubmit={submit}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <header className="at2-nav">
        {page === "form" ? (
          <h2 id={titleId}>{titles.form}</h2>
        ) : (
          <Button variant="secondary" iconOnly className="at2-icon at2-back" icon={buttonIcons.arrowLeft} aria-label="Back" onClick={back} />
        )}
        {page !== "form" ? <h2 id={titleId}>{titles[page]}</h2> : null}
        {page === "form" ? (
          <Button variant="secondary" iconOnly className="at2-icon" icon={buttonIcons.close} aria-label="Close" onClick={onClose} />
        ) : page === "receipt" ? (
          <span className="at2-nav-gap" />
        ) : (
          <Button variant="secondary" className="at2-add" icon={buttonIcons.addOutline} onClick={back}>
            {page === "category" ? "Add category" : page === "account" ? "Add account" : "Add beneficiaries"}
          </Button>
        )}
      </header>

      <div className="at2-shell">
        {page === "form" ? (
          <>
            <div className="at2-types" role="tablist" aria-label="Transaction type">
              {TYPES.map((type) => (
                <Button
                  key={type.id}
                  variant="secondary"
                  role="tab"
                  icon={type.icon}
                  aria-selected={draft.type === type.id}
                  className={draft.type === type.id ? "at2-type is-on" : "at2-type"}
                  onClick={() => {
                    const nextCategories = CATEGORIES.filter((item) => item.type === (type.id === "INCOME" ? "INCOME" : "EXPENSE"));
                    patch({
                      type: type.id,
                      categoryL1: nextCategories[0]?.l1 ?? "",
                      categoryL2: "",
                    });
                  }}
                >
                  {type.label}
                </Button>
              ))}
            </div>

            <div className="at2-amount">
              <span>Transaction amount</span>
              <label>
                <input
                  inputMode="numeric"
                  aria-label="Transaction amount"
                  className={draft.amount ? "is-filled" : ""}
                  value={formatAmount(draft.amount)}
                  onChange={(event) => patch({ amount: event.target.value.replace(/\D/g, "").replace(/^0+/, "") })}
                />
              </label>
            </div>

            <div className="at2-well">
              <label className="at2-title-row">
                <input
                  aria-label="Transaction name"
                  placeholder="Transaction name"
                  value={draft.name}
                  onChange={(event) => patch({ name: event.target.value })}
                />
              </label>
              <div className="at2-rule" />

              {draft.type !== "INCOME" ? (
                <>
                  <button type="button" className="at2-row" onClick={() => openPicker("category")}>
                    <span>Category</span>
                    <span className="at2-value">
                      <span className="at2-swatch" style={{ "--swatch": category?.color ?? "#EC407A" }} />
                      {categoryLabel}
                      <Glyph svg={buttonIcons.arrowDown} className="at2-chevron" />
                    </span>
                  </button>
                  <div className="at2-rule" />
                </>
              ) : null}

              {draft.type === "TRANSFER" ? (
                <>
                  <button type="button" className="at2-row" onClick={() => openPicker("account", "from")}>
                    <span>From</span>
                    <span className="at2-value">
                      {account ? <WalletMark id={account.id} /> : null}
                      {account?.name}
                      <Glyph svg={buttonIcons.arrowDown} className="at2-chevron" />
                    </span>
                  </button>
                  <div className="at2-rule" />
                  <button type="button" className="at2-row" onClick={() => openPicker("account", "to")}>
                    <span>To</span>
                    <span className="at2-value">
                      {toAccount ? <WalletMark id={toAccount.id} /> : null}
                      {toAccount?.name}
                      <Glyph svg={buttonIcons.arrowDown} className="at2-chevron" />
                    </span>
                  </button>
                  <div className="at2-rule" />
                </>
              ) : (
                <>
                  {draft.type === "INCOME" ? (
                    <>
                      <button type="button" className="at2-row" onClick={() => openPicker("category")}>
                        <span>Category</span>
                        <span className="at2-value">
                          <span className="at2-swatch" style={{ "--swatch": category?.color ?? "#4CAF50" }} />
                          {categoryLabel}
                          <Glyph svg={buttonIcons.arrowDown} className="at2-chevron" />
                        </span>
                      </button>
                      <div className="at2-rule" />
                    </>
                  ) : null}
                  <button type="button" className="at2-row" onClick={() => openPicker("account", "from")}>
                    <span>Account</span>
                    <span className="at2-value">
                      {account ? <WalletMark id={account.id} /> : null}
                      {account?.name}
                      <Glyph svg={buttonIcons.arrowDown} className="at2-chevron" />
                    </span>
                  </button>
                  <div className="at2-rule" />
                </>
              )}

              <label className="at2-row">
                <span>Date</span>
                <span className="at2-value">
                  <Glyph svg={buttonIcons.calendar} className="at2-chevron" />
                  {formatDate(draft.date)}
                  <Glyph svg={buttonIcons.arrowDown} className="at2-chevron" />
                  <input
                    type="date"
                    aria-label="Date"
                    value={draft.date}
                    onChange={(event) => patch({ date: event.target.value })}
                  />
                </span>
              </label>
              <div className="at2-rule" />

              <label className="at2-notes">
                <span>Notes*</span>
                <textarea
                  placeholder="Put note here"
                  value={draft.notes}
                  onChange={(event) => patch({ notes: event.target.value })}
                />
              </label>

              {draft.type === "EXPENSE" ? (
                <>
                  <div className="at2-rule" />
                  <button type="button" className="at2-row" onClick={() => openPicker("beneficiary")}>
                    <span>Beneficiary*</span>
                    <span className={`at2-value${people.length ? "" : " is-empty"}`}>
                      <span className="at2-people">
                        {(people.length ? people.slice(0, 2) : [{ id: "none" }]).map((person) => (
                          <PersonMark key={person.id} empty={!people.length} />
                        ))}
                      </span>
                      {people.length === 0 ? "None" : people.length === 1 ? people[0].name : `${people.length} peoples`}
                      <Glyph svg={buttonIcons.arrowDown} className="at2-chevron" />
                    </span>
                  </button>
                  <div className="at2-rule" />
                  <button type="button" className="at2-row" onClick={() => openPicker("receipt")}>
                    <span>Receipt details*</span>
                    <span className="at2-value is-empty">
                      None
                      <Glyph svg={buttonIcons.arrowRight} className="at2-chevron" />
                    </span>
                  </button>
                </>
              ) : null}
            </div>

            <div className="at2-spacer" />
            <div className="at2-footer">
              <Button variant="primary" icon={buttonIcons.add} className="at2-save" type="submit">
                Add transaction
              </Button>
            </div>
          </>
        ) : null}

        {page !== "form" && page !== "receipt" ? (
          <label className="at2-search">
            <Glyph svg={buttonIcons.search} />
            <input
              placeholder="Search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        ) : null}

        {page === "category" ? (
          <div className="at2-list">
            {filteredCategories.map((item, index) => {
              const open = openGroups.has(item.l1);
              const childSelected = draft.categoryL1 === item.l1 && item.l2.includes(draft.categoryL2);
              const parentSelected = draft.categoryL1 === item.l1 && !draft.categoryL2;
              const parentState = parentSelected ? "selected" : childSelected ? "partial" : "unselected";
              return (
                <div key={item.l1}>
                  {index > 0 ? <div className="at2-rule" /> : null}
                  <div className="at2-pick">
                    <span className="at2-swatch is-lg" style={{ "--swatch": item.color }} />
                    <button
                      type="button"
                      className="at2-pick-name"
                      onClick={() => {
                        setOpenGroups((current) => {
                          const next = new Set(current);
                          if (next.has(item.l1)) next.delete(item.l1);
                          else next.add(item.l1);
                          return next;
                        });
                      }}
                    >
                      {item.l1}
                      {item.l2.length ? <Glyph svg={open ? buttonIcons.arrowDown : buttonIcons.arrowRight} className="at2-chevron" /> : null}
                    </button>
                    <button
                      type="button"
                      className="at2-pick-radio"
                      aria-label={`Select ${item.l1}`}
                      onClick={() => {
                        patch({ categoryL1: item.l1, categoryL2: "" });
                        back();
                      }}
                    >
                      <Radio state={parentState} />
                    </button>
                  </div>
                  {open
                    ? item.l2
                        .filter((child) => !query.trim() || child.toLowerCase().includes(query.trim().toLowerCase()) || item.l1.toLowerCase().includes(query.trim().toLowerCase()))
                        .map((child) => (
                          <button
                            key={child}
                            type="button"
                            className="at2-pick is-child"
                            onClick={() => {
                              patch({ categoryL1: item.l1, categoryL2: child });
                              back();
                            }}
                          >
                            <span className="at2-swatch is-lg is-ghost" style={{ "--swatch": item.color }} />
                            <span className="at2-pick-name">{child}</span>
                            <Radio state={draft.categoryL1 === item.l1 && draft.categoryL2 === child ? "selected" : "unselected"} />
                          </button>
                        ))
                    : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {page === "account" ? (
          <div className="at2-list">
            {filteredWallets.map((wallet, index) => {
              const selected = (accountTarget === "to" ? draft.toAccount : draft.account) === wallet.id;
              return (
                <div key={wallet.id}>
                  {index > 0 ? <div className="at2-rule" /> : null}
                  <button
                    type="button"
                    className="at2-pick"
                    onClick={() => {
                      patch(accountTarget === "to" ? { toAccount: wallet.id } : { account: wallet.id });
                      back();
                    }}
                  >
                    <WalletMark id={wallet.id} />
                    <span className="at2-pick-name">{wallet.name}</span>
                    <Radio state={selected ? "selected" : "unselected"} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        {page === "beneficiary" ? (
          <div className="at2-list">
            {filteredPeople.map((person, index) => {
              const selected = draft.people.includes(person.id);
              return (
                <div key={person.id}>
                  {index > 0 ? <div className="at2-rule" /> : null}
                  <button
                    type="button"
                    className="at2-pick"
                    onClick={() => {
                      patch({
                        people: selected
                          ? draft.people.filter((id) => id !== person.id)
                          : [...draft.people, person.id],
                      });
                    }}
                  >
                    <PersonMark />
                    <span className="at2-pick-name">{person.name}</span>
                    <Radio state={selected ? "selected" : "unselected"} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        {page === "beneficiary" ? (
          <div className="at2-footer">
            <Button variant="primary" className="at2-save" type="button" onClick={back}>
              Done
            </Button>
          </div>
        ) : null}

        {page === "receipt" ? (
          <div className="at2-list">
            <p className="at2-soon">Receipt details come in the next pass.</p>
          </div>
        ) : null}
      </div>
    </form>
  );

  if (!dialog) return card;

  return (
    <div className="at2-overlay" onMouseDown={onClose}>
      {card}
    </div>
  );
}
