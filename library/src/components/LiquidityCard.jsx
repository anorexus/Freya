import { CopyAmount } from "./CopyAmount.jsx";
import { availableLiquidity, formatRupiah } from "../money.js";
import { formatDay, liquidityPeriod } from "../period.js";
import { Pill } from "./Pill.jsx";
import "./LiquidityCard.css";

function daysLabel(daysLeft) {
  if (daysLeft === 0) return "Last day";
  if (daysLeft === 1) return "1 day";
  return `${daysLeft} days`;
}

function liquidityLevel(daysLeft) {
  if (daysLeft <= 7) return "positive";
  if (daysLeft <= 14) return "warning";
  return "negative";
}

export function LiquidityCard({ wallets, periodStartDay = 1, today = new Date() }) {
  const total = availableLiquidity(wallets);
  const period = liquidityPeriod(today, periodStartDay);
  const walletCount = wallets.length;
  const level = liquidityLevel(period.daysLeft);
  const footer = period.calendarMonth ? "Days left this month" : "Days left until payday";

  return (
    <article className="liq-card">
      <header className="liq-card-head">
        <h2>All accounts</h2>
        <p>From {walletCount} {walletCount === 1 ? "account" : "accounts"}</p>
      </header>
      <div className="liq-card-body">
        <div className="liq-amount">
          <div className="liq-balance">
            <p className="liq-amount-label">Available liquidity</p>
            <p className="liq-amount-value"><CopyAmount>{formatRupiah(total)}</CopyAmount></p>
          </div>
          <div className="liq-timeline">
            <span>{formatDay(period.startDate)}</span>
            <div className="liq-track" aria-hidden="true">
              <div className="liq-scale">
                {period.elapsedDays > 0 && (
                  <div
                    className={`liq-fill is-${level}`}
                    style={{
                      width:
                        period.daysLeft === 0
                          ? "100%"
                          : `calc(${((period.elapsedDays - 0.5) / period.totalDays) * 100}% + 4px)`,
                    }}
                  />
                )}
              </div>
            </div>
            <span>{formatDay(period.endDate)}</span>
          </div>
        </div>
        <footer className="liq-foot">
          <p>{footer}</p>
          <Pill tone={level}>{daysLabel(period.daysLeft)}</Pill>
        </footer>
      </div>
    </article>
  );
}
