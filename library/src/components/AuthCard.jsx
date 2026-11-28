import { Button } from "./Button.jsx";
import hero from "../assets/login/hero.png";
import logomark from "../assets/login/logomark.svg";
import googleMark from "../assets/login/google.png";
import googleCut from "../assets/login/google-cut.svg";
import "./AuthCard.css";

/**
 * @param {{
 *   layout?: "card" | "split",
 *   title: string,
 *   copy: string,
 *   error?: string | null,
 *   primary: string,
 *   onPrimary: () => void,
 *   primaryDisabled?: boolean,
 *   secondary?: string,
 *   onSecondary?: () => void,
 *   onSignOut?: () => void,
 *   choices?: { id: string, title: string, detail: string }[],
 *   onChoose?: (id: string) => void,
 * }} props
 */
export function AuthCard({
  layout = "card",
  title,
  copy,
  error,
  primary,
  onPrimary,
  primaryDisabled = false,
  secondary,
  onSecondary,
  onSignOut,
  choices,
  onChoose,
}) {
  if (layout === "split") {
    return (
      <div className="auth-split">
        <div className="auth-split-hero" aria-hidden="true">
          <img className="auth-split-hero-img" src={hero} alt="" />
        </div>
        <div className="auth-split-pane">
          <section className="auth-split-card">
            <div className="auth-mark">
              <span className="auth-mark-spin">
                <span className="auth-mark-rot">
                  <img src={logomark} alt="" />
                </span>
              </span>
            </div>
            <div className="auth-split-body">
              <div className="auth-split-copy">
                <h1>{title}</h1>
                <p>{copy}</p>
              </div>
              <div className="auth-split-actions">
                {error ? <p className="auth-error">{error}</p> : null}
                <div className="auth-split-buttons">
                  <button type="button" className="auth-google" onClick={onPrimary} disabled={primaryDisabled}>
                    <span className="auth-google-slot" aria-hidden="true" />
                    <span>{primary}</span>
                    <span className="auth-google-slot">
                      <GoogleIcon />
                    </span>
                  </button>
                  {secondary && onSecondary ? (
                    <button type="button" className="auth-sim" onClick={onSecondary} disabled={primaryDisabled}>
                      {secondary}
                    </button>
                  ) : null}
                </div>
                <p className="auth-legal">
                  By clicking “Continue with Google”, you acknowledge that you have read and understood, and agree to Freya’s Terms & Conditions and Privacy Policy.
                </p>
                {onSignOut ? (
                  <button type="button" className="auth-quiet" onClick={onSignOut}>
                    Sign out
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <section className="auth-card">
        <h1>{title}</h1>
        <p>{copy}</p>
        {choices && onChoose ? (
          <div className="auth-choices">
            {choices.map((choice) => (
              <button key={choice.id} type="button" className="auth-choice" onClick={() => onChoose(choice.id)} disabled={primaryDisabled}>
                <span className="auth-choice-title">{choice.title}</span>
                <span className="auth-choice-detail">{choice.detail}</span>
              </button>
            ))}
          </div>
        ) : null}
        {error ? <p className="auth-error">{error}</p> : null}
        <div className="auth-actions">
          <Button variant="primary" className="auth-action" onClick={onPrimary} disabled={primaryDisabled}>
            {primary}
          </Button>
          {secondary && onSecondary ? (
            <Button variant="secondary" className="auth-action" onClick={onSecondary} disabled={primaryDisabled}>
              {secondary}
            </Button>
          ) : null}
          {onSignOut ? (
            <Button variant="nude" className="auth-action" onClick={onSignOut}>
              Sign out
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function GoogleIcon() {
  return (
    <span className="auth-google-icon">
      <img className="auth-google-base" src={googleMark} alt="" width="17" height="18" />
      <img className="auth-google-cut" src={googleCut} alt="" />
    </span>
  );
}
