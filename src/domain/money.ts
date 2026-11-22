export function todayISO(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(iso: string, delta: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

export function shiftMonth(iso: string, delta: number): string {
  const [year, month] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

export function monthEnd(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return `${month}-${String(last).padStart(2, "0")}`;
}

export function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function formatAmount(value: number): string {
  const hasFraction = Math.abs(value % 1) > 0.001;
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(value);
}

export function formatSignedAmount(type: string, value: number): string {
  const amount = formatAmount(value);
  return type === "INCOME" ? `+${amount}` : amount;
}

/** Accepts 186400 or Indonesian grouping 186.400. */
export function parseAmountInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, "");
  if (!trimmed) return null;
  if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    const grouped = Number(trimmed.replace(/\./g, ""));
    return Number.isFinite(grouped) && grouped > 0 ? grouped : null;
  }
  const normalized = trimmed.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function formatDelta(current: number, previous: number): string | null {
  if (previous === 0) return null;
  const percent = Math.round(((current - previous) / previous) * 100);
  return `${percent > 0 ? "+" : ""}${percent}%`;
}

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(utcDate(iso));
}

export function formatMonth(iso: string, month: "long" | "short" = "long"): string {
  return new Intl.DateTimeFormat("en-GB", { month, timeZone: "UTC" }).format(utcDate(iso));
}

export function formatSynced(date: Date): string {
  const day = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${day}, ${time}`;
}

function utcDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}
