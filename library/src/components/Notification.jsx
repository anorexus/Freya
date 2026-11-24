import { useState } from "react";
import "./Notification.css";

const CLOSE_PATH =
  "M0.292893 0.292893C0.683418 -0.0976312 1.31658 -0.097631 1.70711 0.292893L3.35705 1.94283C3.6174 2.20318 4.03951 2.20318 4.29986 1.94283L5.94977 0.292917C6.34029 -0.0976073 6.97346 -0.0976078 7.36398 0.292917C7.75451 0.683441 7.75451 1.31661 7.36398 1.70713L5.71407 3.35705C5.45372 3.6174 5.45372 4.03951 5.71407 4.29985L7.36396 5.94975C7.75448 6.34027 7.75448 6.97344 7.36396 7.36396C6.97344 7.75449 6.34027 7.75449 5.94975 7.36396L4.29985 5.71407C4.0395 5.45372 3.61739 5.45372 3.35704 5.71407L1.70713 7.36398C1.31661 7.75451 0.683441 7.75451 0.292917 7.36398C-0.0976076 6.97346 -0.0976078 6.3403 0.292917 5.94977L1.94283 4.29986C2.20318 4.03951 2.20318 3.6174 1.94283 3.35705L0.292893 1.70711C-0.0976312 1.31658 -0.097631 0.683417 0.292893 0.292893Z";

export function Notification({ tone = "notice", title, children }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className={`note is-${tone}`} role="status">
      <div className="note-copy">
        <p className="note-title">{title}</p>
        <p className="note-body">{children}</p>
      </div>
      <button type="button" className="note-close" aria-label="Dismiss" onClick={() => setOpen(false)}>
        <svg width="7.65688" height="7.65688" viewBox="0 0 7.65688 7.65688" aria-hidden="true">
          <path d={CLOSE_PATH} fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
