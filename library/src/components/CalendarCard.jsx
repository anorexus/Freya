import { useEffect, useRef, useState } from "react";
import gripLeft from "../assets/calendar/grip-left.svg";
import arrowRight from "../assets/calendar/arrow-right.svg";
import netflixLogo from "../assets/calendar/netflix.png";
import cursorLogo from "../assets/calendar/cursor.png";
import "./CalendarCard.css";

const MOCK_BILLS = [
  { offset: -2, name: "Netflix", logo: netflixLogo },
  { offset: 1, name: "Cursor", logo: cursorLogo },
  { offset: 2, name: "Spotify" },
  { offset: 2, name: "iCloud" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, count) {
  const next = startOfDay(date);
  next.setDate(next.getDate() + count);
  return next;
}

function formatCompact(amount) {
  const abs = Math.abs(Math.round(amount));
  if (abs >= 1_000_000) {
    const jt = (abs / 1_000_000).toFixed(1).replace(/\.0$/, "").replace(".", ",");
    return `Rp${jt}jt`;
  }
  const body = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `Rp${body}`;
}

function dayFacts(transactions, anchor, date) {
  const key = startOfDay(date).getTime();
  const offset = Math.round((key - startOfDay(anchor).getTime()) / 86_400_000);
  const bills = MOCK_BILLS.filter((bill) => bill.offset === offset).map((bill) => ({ ...bill }));
  let income = 0;
  let expense = 0;
  for (const transaction of transactions) {
    if (startOfDay(transaction.date).getTime() !== key) continue;
    if (transaction.type === "INCOME") income += transaction.amount;
    if (transaction.type === "EXPENSE") expense += transaction.amount;
    const name = transaction.bill || transaction.subscription;
    if (name && !bills.some((bill) => bill.name === name)) bills.push({ name });
  }
  return { income, expense, bills };
}

export function CalendarCard({ transactions = [], today = new Date(), focus = today, onToday = () => {} }) {
  const cardRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(7);
  const realToday = startOfDay(today);
  const anchor = startOfDay(focus);
  const focusTime = anchor.getTime();
  const [shift, setShift] = useState(0);
  const [selected, setSelected] = useState(focusTime);

  useEffect(() => {
    setShift(0);
    setSelected(focusTime);
  }, [focusTime]);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return undefined;
    const apply = () => {
      const width = node.clientWidth;
      setVisibleCount(width < 560 ? 3 : width < 860 ? 5 : 7);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const center = addDays(anchor, shift);
  const span = Math.floor(visibleCount / 2);
  const days = Array.from({ length: visibleCount }, (_, index) => addDays(center, index - span));
  const onRealToday = center.getTime() === realToday.getTime();

  return (
    <article className="cal-card" ref={cardRef}>
      <header className="cal-head">
        <h2>Calendar</h2>
        <button
          type="button"
          className="cal-today"
          disabled={onRealToday}
          onClick={() => {
            setShift(0);
            setSelected(realToday.getTime());
            onToday();
          }}
        >
          Today
        </button>
      </header>
      <div className="cal-well" style={{ "--cal-days": visibleCount }}>
        <div className="cal-weekdays">
          {days.map((day) => (
            <div key={day.getTime()} className="cal-weekday">{WEEKDAYS[day.getDay()]}</div>
          ))}
        </div>
        <div className="cal-row">
          {days.map((day) => {
            const time = day.getTime();
            const facts = dayFacts(transactions, anchor, day);
            const isToday = time === realToday.getTime();
            const isSelected = time === selected;
            const upcoming = time > realToday.getTime();
            const tone = isToday ? "is-today" : isSelected ? "is-selected" : upcoming ? "is-upcoming" : "is-past";
            const bill = facts.bills.length === 1 ? facts.bills[0] : null;
            const billLabel = bill ? bill.name : facts.bills.length > 1 ? `${facts.bills.length} Bills` : "";
            return (
              <button
                key={time}
                type="button"
                className={`cal-day ${tone}`}
                onClick={() => setSelected(time)}
              >
                <div className="cal-date">
                  <span className="cal-num">{day.getDate()}</span>
                  {billLabel ? (
                    <span className="cal-bill">
                      {bill?.logo ? <img src={bill.logo} alt="" width="16" height="16" /> : null}
                      {billLabel}
                    </span>
                  ) : null}
                </div>
                {upcoming ? null : (
                  <div className="cal-amounts">
                    {facts.expense > 0 ? <span>{formatCompact(facts.expense)}</span> : null}
                    {facts.income > 0 ? <span className="is-income">{formatCompact(facts.income)}</span> : null}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="cal-grip">
          <button type="button" className="cal-step" aria-label="Previous day" onClick={() => setShift((value) => value - 1)}>
            <img src={gripLeft} alt="" width="16" height="16" />
          </button>
          <span className="cal-track" aria-hidden="true" />
          <button type="button" className="cal-step" aria-label="Next day" onClick={() => setShift((value) => value + 1)}>
            <img src={arrowRight} alt="" width="16" height="16" />
          </button>
        </div>
      </div>
    </article>
  );
}
