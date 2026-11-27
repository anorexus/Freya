import { useEffect, useState, type FormEvent } from "react";
import { categoriesFor } from "../data/categories";
import { parseAmountInput, todayISO } from "../domain/money";
import type { NewLine } from "../domain/types";
import { useLedger } from "../state/LedgerContext";

type LineDraft = {
  amount: string;
  categoryL1: string;
  categoryL2: string;
  itemName: string;
};

export function LogDialog() {
  const { logOpen, setLogOpen, addTransaction, schema, categories } = useLedger();
  const [mode, setMode] = useState<"single" | "receipt">("single");
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([blankLine("EXPENSE", categories)]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!logOpen) return;
    setDate(todayISO());
    setType("EXPENSE");
    setNotes("");
    setLines([blankLine("EXPENSE", categories)]);
    setMode("single");
    setError(null);
  }, [logOpen, categories]);

  useEffect(() => {
    if (!logOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLogOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [logOpen, setLogOpen]);

  if (!logOpen) return null;

  const options = categoriesFor(type, categories);
  const activeLines = mode === "single" ? lines.slice(0, 1) : lines;

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)));
  }

  function changeType(next: "INCOME" | "EXPENSE") {
    setType(next);
    const nextCategory = categoriesFor(next, categories)[0]?.l1 ?? "";
    setLines((current) => current.map((line) => ({ ...line, categoryL1: nextCategory, categoryL2: "" })));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!schema.ok) return;
    const parsed: NewLine[] = [];
    for (const line of activeLines) {
      const amount = parseAmountInput(line.amount);
      if (amount === null) {
        setError("Amount has to be a number greater than zero.");
        return;
      }
      if (!line.categoryL1.trim()) {
        setError("Choose a category.");
        return;
      }
      parsed.push({
        amount,
        categoryL1: line.categoryL1.trim(),
        categoryL2: line.categoryL2.trim(),
        itemName: line.itemName.trim(),
      });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Choose a date.");
      return;
    }
    addTransaction({ date, type, notes: notes.trim(), lines: parsed });
  }

  return (
    <div className="fy-modal-back" onMouseDown={() => setLogOpen(false)}>
      <div
        className="fy-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="fy-card-head">
          <h2 id="log-title" className="fy-page-title">
            {mode === "single" ? "Log transaction" : "Log receipt"}
          </h2>
          <button className="fy-btn fy-btn-ghost" type="button" onClick={() => setLogOpen(false)}>
            Cancel
          </button>
        </div>
        <div className="fy-actions" style={{ marginBottom: 16 }}>
          <button className={mode === "single" ? "fy-btn fy-btn-secondary" : "fy-btn fy-btn-ghost"} type="button" onClick={() => setMode("single")}>
            Single item
          </button>
          <button className={mode === "receipt" ? "fy-btn fy-btn-secondary" : "fy-btn fy-btn-ghost"} type="button" onClick={() => setMode("receipt")}>
            Receipt
          </button>
        </div>
        <form onSubmit={onSubmit} className="fy-form">
          <div className="fy-form-grid">
            <label className="fy-field">
              <span className="fy-field-label">Date</span>
              <input className="fy-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
            </label>
            <label className="fy-field">
              <span className="fy-field-label">Type</span>
              <select className="fy-select" value={type} onChange={(event) => changeType(event.target.value as "INCOME" | "EXPENSE")}>
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </label>
          </div>

          {activeLines.map((line, index) => {
            const l2Options = options.find((option) => option.l1 === line.categoryL1)?.l2 ?? [];
            return (
              <div className={mode === "receipt" ? "fy-line" : "fy-form-grid"} key={index}>
                <label className="fy-field">
                  <span className="fy-field-label">Amount</span>
                  <input
                    className="fy-input"
                    inputMode="decimal"
                    placeholder="0"
                    value={line.amount}
                    onChange={(event) => updateLine(index, { amount: event.target.value })}
                  />
                </label>
                <label className="fy-field">
                  <span className="fy-field-label">Category</span>
                  <select
                    className="fy-select"
                    value={line.categoryL1}
                    onChange={(event) => updateLine(index, { categoryL1: event.target.value, categoryL2: "" })}
                  >
                    {options.map((option) => (
                      <option key={option.l1} value={option.l1}>
                        {option.l1}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="fy-field">
                  <span className="fy-field-label">Sub-category</span>
                  <select
                    className="fy-select"
                    value={line.categoryL2}
                    onChange={(event) => updateLine(index, { categoryL2: event.target.value })}
                  >
                    <option value="">None</option>
                    {l2Options.map((l2) => (
                      <option key={l2} value={l2}>
                        {l2}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="fy-field">
                  <span className="fy-field-label">Item name</span>
                  <input
                    className="fy-input"
                    value={line.itemName}
                    placeholder="Optional"
                    onChange={(event) => updateLine(index, { itemName: event.target.value })}
                  />
                </label>
                {mode === "receipt" && lines.length > 1 ? (
                  <button className="fy-btn fy-btn-ghost" type="button" onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}>
                    Remove
                  </button>
                ) : null}
              </div>
            );
          })}

          <label className="fy-field">
            <span className="fy-field-label">Notes</span>
            <input className="fy-input" value={notes} placeholder="Receipt or transaction note" onChange={(event) => setNotes(event.target.value)} />
            <span className={error ? "fy-help is-error" : "fy-help"}>
              {error ?? "Stored as a positive number. Type decides the sign."}
            </span>
          </label>

          <div className="fy-actions">
            {mode === "receipt" ? (
              <button
                className="fy-btn fy-btn-ghost"
                type="button"
                onClick={() => setLines((current) => [...current, blankLine(type, categories)])}
              >
                Add line
              </button>
            ) : null}
            <button className="fy-btn fy-btn-primary" type="submit" disabled={!schema.ok}>
              Log transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function blankLine(type: "INCOME" | "EXPENSE", source: Parameters<typeof categoriesFor>[1]): LineDraft {
  return {
    amount: "",
    categoryL1: categoriesFor(type, source)[0]?.l1 ?? "",
    categoryL2: "",
    itemName: "",
  };
}
