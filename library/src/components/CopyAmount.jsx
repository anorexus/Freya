import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./CopyAmount.css";

export function CopyAmount({ children }) {
  const text = children == null ? "" : String(children);
  const [toast, setToast] = useState(null);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <span
      className="fy-amount"
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!text || !navigator.clipboard) return;
        const x = Math.min(event.clientX + 12, window.innerWidth - 96);
        const y = Math.min(event.clientY + 16, window.innerHeight - 36);
        navigator.clipboard.writeText(text).then(() => {
          setToast({ x, y });
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setToast(null), 1200);
        });
      }}
    >
      {children}
      {toast
        ? createPortal(
            <span className="fy-copied" style={{ left: toast.x, top: toast.y }} role="status">
              Copied !
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
