import { useMemo, useState } from "react";
import { CatIcon } from "../components/Icons";
import { categoriesFor } from "../data/categories";
import { categoryBreakdown, rangeForPreset } from "../domain/aggregate";
import { formatAmount, todayISO } from "../domain/money";
import { useLedger } from "../state/LedgerContext";

type Preset = "month" | "six" | "all";

export function Categories() {
  const ledger = useLedger();
  const [preset, setPreset] = useState<Preset>("month");
  const [category, setCategory] = useState("All");
  const today = todayISO();
  const slices = useMemo(() => {
    const range = rangeForPreset(preset, today);
    const all = categoryBreakdown(ledger.rows, range.from, range.to);
    return category === "All" ? all : all.filter((slice) => slice.categoryL1 === category);
  }, [ledger.rows, preset, category, today]);
  const configured = categoriesFor("EXPENSE", ledger.categories);
  const iconFor = new Map(configured.map((option) => [option.l1, option.icon]));
  const options = configured.map((option) => option.l1);
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);

  return (
    <>
      <div>
        <h2 className="fy-page-title">Categories</h2>
        <p className="fy-page-sub">
          <span>Expense by sub-category</span>
          <span>Rp {formatAmount(total)}</span>
        </p>
      </div>
      <div className="fy-form-grid fy-filters">
        <label className="fy-field">
          <span className="fy-field-label">Range</span>
          <select className="fy-select" value={preset} onChange={(event) => setPreset(event.target.value as Preset)}>
            <option value="month">This month</option>
            <option value="six">Trailing 6 months</option>
            <option value="all">All time</option>
          </select>
        </label>
        <label className="fy-field">
          <span className="fy-field-label">Category</span>
          <select className="fy-select" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="All">All categories</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <section className="fy-card">
        {slices.length === 0 ? (
          <div className="fy-empty">
            <h3>No spending in this range</h3>
            <p>Log an expense, or widen the range, to see the L2 breakdown.</p>
          </div>
        ) : (
          <table className="fy-sheet">
            <thead>
              <tr>
                <th>Category</th>
                <th>Sub-category</th>
                <th className="is-num">Share</th>
                <th className="is-num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {slices.map((slice) => (
                <tr key={`${slice.categoryL1}-${slice.categoryL2}`}>
                  <td>
                    <span className="fy-actions">
                      <CatIcon name={iconFor.get(slice.categoryL1) ?? slice.categoryL1} />
                      {slice.categoryL1}
                    </span>
                  </td>
                  <td>{slice.categoryL2}</td>
                  <td className="is-num">{Math.round(slice.share * 100)}%</td>
                  <td className="is-num">{formatAmount(slice.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
