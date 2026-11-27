import "./ProgressBar.css";

const LEVELS = {
  positive: "is-positive",
  warning: "is-warning",
  negative: "is-negative",
};

export function ProgressBar({ value = 0, level = "positive" }) {
  const width = Math.min(100, Math.max(0, value));
  const tone = LEVELS[level] || LEVELS.positive;

  return (
    <div className="progress-bar">
      {width > 0 && <div className={`progress-bar-fill ${tone}`} style={{ width: `${width}%` }} />}
    </div>
  );
}
