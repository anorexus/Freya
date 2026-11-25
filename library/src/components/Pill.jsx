import "./Pill.css";

export function Pill({ tone, className = "", children, ...rest }) {
  const classes = ["pill", tone ? `is-${tone}` : "", className].filter(Boolean).join(" ");
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
