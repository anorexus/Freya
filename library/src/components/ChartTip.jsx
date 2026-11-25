import { CopyAmount } from "./CopyAmount.jsx";
import "./ChartTip.css";

export function ChartTip({ amount, tone = "neutral", children }) {
  const polarity = tone === "signed" && amount ? (amount < 0 ? "is-negative" : "is-positive") : "";
  return (
    <span className={["chart-tip", polarity].filter(Boolean).join(" ")}>
      <CopyAmount>{children}</CopyAmount>
    </span>
  );
}
