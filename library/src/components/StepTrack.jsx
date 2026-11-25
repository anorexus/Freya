import "./StepTrack.css";

export function StepTrack({ steps, index, label, onChange }) {
  const count = Math.max(0, steps);
  const current = count === 0 ? 0 : Math.min(count - 1, Math.max(0, index));
  const visible = count > 1;
  const interactive = typeof onChange === "function" && visible;

  function seek(event) {
    if (!interactive) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = rect.width === 0 ? 0 : (event.clientX - rect.left) / rect.width;
    onChange(Math.round(Math.min(1, Math.max(0, ratio)) * (count - 1)));
  }

  return (
    <div
      className={["step-track", interactive ? "is-interactive" : "", visible ? "" : "is-hidden"].filter(Boolean).join(" ")}
      aria-hidden={interactive ? undefined : true}
      role={interactive ? "slider" : undefined}
      aria-label={interactive ? label : undefined}
      aria-valuemin={interactive ? 0 : undefined}
      aria-valuemax={interactive ? count - 1 : undefined}
      aria-valuenow={interactive ? current : undefined}
      onPointerDown={interactive ? seek : undefined}
    >
      {count > 0 ? (
        <span
          className="step-thumb"
          style={{
            width: `calc((100% - 4px) / ${count})`,
            left: `calc(2px + (100% - 4px) * ${current} / ${count})`,
          }}
        />
      ) : null}
    </div>
  );
}
