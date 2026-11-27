import { Button } from "./Button.jsx";
import "./AuthCard.css";

export function AuthCard({
  title,
  copy,
  error,
  primary,
  onPrimary,
  primaryDisabled = false,
  secondary,
  onSecondary,
  onSignOut,
}) {
  return (
    <div className="auth">
      <section className="auth-card">
        <h1>{title}</h1>
        <p>{copy}</p>
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
