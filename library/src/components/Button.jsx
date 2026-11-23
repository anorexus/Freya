import { useState } from "react";
import syncIcon from "../assets/buttons/sync.svg?raw";
import addIcon from "../assets/buttons/add.svg?raw";
import expandNav from "../assets/buttons/expand-nav.svg?raw";
import expandDrop from "../assets/buttons/expand-drop.svg?raw";
import "./Button.css";

function Glyph({ svg, badge = false }) {
  const mark = <span className="fy-glyph" dangerouslySetInnerHTML={{ __html: svg }} />;
  if (!badge) return mark;
  return <span className="fy-badge">{mark}</span>;
}

export function Button({ variant = "secondary", icon, children, ...props }) {
  const badge = variant === "primary" || variant === "secondary";
  const leading = variant !== "dropdown";

  return (
    <button type="button" className={`fy-btn is-${variant}`} {...props}>
      {leading && icon ? <Glyph svg={icon} badge={badge} /> : null}
      {children}
      {variant === "dropdown" ? <Glyph svg={expandDrop} /> : null}
    </button>
  );
}

export function WalletDropdown({ options }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(options[0]);

  return (
    <div className="fy-drop">
      <Button
        variant="dropdown"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
      >
        {value}
      </Button>
      {open ? (
        <ul className="fy-drop-list" role="listbox">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={option === value}
                onClick={() => {
                  setValue(option);
                  setOpen(false);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export const buttonIcons = { sync: syncIcon, add: addIcon, expand: expandNav };
