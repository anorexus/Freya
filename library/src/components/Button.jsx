import { useEffect, useRef, useState } from "react";
import syncIcon from "../assets/icons/sync.svg?raw";
import addIcon from "../assets/icons/add.svg?raw";
import arrowDown from "../assets/icons/arrow-down.svg?raw";
import arrowLeft from "../assets/icons/arrow-left.svg?raw";
import arrowRight from "../assets/icons/arrow-right.svg?raw";
import arrowUp from "../assets/icons/arrow-up.svg?raw";
import expandIcon from "../assets/icons/expand.svg?raw";
import collapsedIcon from "../assets/icons/collapsed.svg?raw";
import trendUp from "../assets/icons/trend-up.svg?raw";
import trendDown from "../assets/icons/trend-down.svg?raw";
import allIcon from "../assets/icons/all.svg?raw";
import closeIcon from "../assets/icons/close.svg?raw";
import menuIcon from "../assets/icons/menu.svg?raw";
import hamburgerIcon from "../assets/icons/hamburger.svg?raw";
import expenseIcon from "../assets/icons/expense.svg?raw";
import incomeIcon from "../assets/icons/income.svg?raw";
import transferIcon from "../assets/icons/transfer.svg?raw";
import backIcon from "../assets/icons/back.svg?raw";
import calendarIcon from "../assets/icons/calendar.svg?raw";
import userIcon from "../assets/icons/user.svg?raw";
import addOutlineIcon from "../assets/icons/add-outline.svg?raw";
import searchIcon from "../assets/icons/search.svg?raw";
import bcaMark from "../assets/wallets/bca.svg";
import gopayMark from "../assets/wallets/gopay.png";
import cashMark from "../assets/wallets/cash.svg";
import "./Button.css";

function Glyph({ svg, badge = false }) {
  const mark = <span className="fy-glyph" dangerouslySetInnerHTML={{ __html: svg }} />;
  if (!badge) return mark;
  return <span className="fy-badge">{mark}</span>;
}

export function Button({ variant = "secondary", icon, iconOnly = false, className, children, ...props }) {
  const badge = variant === "primary";
  const leading = variant !== "dropdown";
  const classes = [`fy-btn`, `is-${variant}`, iconOnly ? "is-icon" : "", className].filter(Boolean).join(" ");

  return (
    <button type="button" className={classes} {...props}>
      {leading && icon ? <Glyph svg={icon} badge={badge} /> : null}
      {children}
      {variant === "dropdown" ? <Glyph svg={arrowDown} /> : null}
    </button>
  );
}

function WalletMark({ id }) {
  if (id === "all") {
    return <span className="fy-wallet-mark is-all" dangerouslySetInnerHTML={{ __html: allIcon }} />;
  }
  if (id === "bca") {
    return (
      <span className="fy-wallet-mark is-bca">
        <img src={bcaMark} alt="" />
      </span>
    );
  }
  if (id === "gopay") {
    return (
      <span className="fy-wallet-mark is-gopay">
        <img src={gopayMark} alt="" />
      </span>
    );
  }
  return (
    <span className="fy-wallet-mark is-cash">
      <img src={cashMark} alt="" />
    </span>
  );
}

export function useDismiss(open, ref, close) {
  useEffect(() => {
    if (!open) return undefined;
    function onPointer(event) {
      if (!ref.current?.contains(event.target)) close();
    }
    function onKey(event) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, ref, close]);
}

export function WalletDropdown({ wallets, value: valueProp, onChange, className }) {
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState("all");
  const value = valueProp ?? inner;
  const rootRef = useRef(null);
  const current = wallets.find((wallet) => wallet.id === value);
  const label = current ? current.name : "All wallets";
  useDismiss(open, rootRef, () => setOpen(false));

  function choose(next) {
    if (valueProp === undefined) setInner(next);
    onChange?.(next);
    setOpen(false);
  }

  return (
    <div className={["fy-drop", "is-wallets", className].filter(Boolean).join(" ")} ref={rootRef}>
      <Button
        variant="dropdown"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
      >
        {label}
      </Button>
      {open ? (
        <ul className="fy-wallet-menu" role="listbox">
          <li>
            <button
              type="button"
              role="option"
              aria-selected={value === "all"}
              onClick={() => choose("all")}
            >
              <WalletMark id="all" />
              All wallets
            </button>
          </li>
          {wallets.map((wallet) => (
            <li key={wallet.id}>
              <button
                type="button"
                role="option"
                aria-selected={wallet.id === value}
                onClick={() => choose(wallet.id)}
              >
                <WalletMark id={wallet.id} />
                {wallet.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export const buttonIcons = {
  sync: syncIcon,
  add: addIcon,
  expand: expandIcon,
  collapsed: collapsedIcon,
  arrowDown,
  arrowUp,
  arrowLeft,
  arrowRight,
  trendUp,
  trendDown,
  menu: menuIcon,
  close: closeIcon,
  hamburger: hamburgerIcon,
  expense: expenseIcon,
  income: incomeIcon,
  transfer: transferIcon,
  back: backIcon,
  calendar: calendarIcon,
  user: userIcon,
  addOutline: addOutlineIcon,
  search: searchIcon,
};
