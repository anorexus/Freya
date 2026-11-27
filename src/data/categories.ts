export type CategoryOption = {
  type: "INCOME" | "EXPENSE";
  l1: string;
  l2: string[];
  icon: string;
  color: string;
};

export const DEFAULT_ICON = "bag";
export const DEFAULT_COLOR = "#9E9E9E";

export const CATEGORIES: CategoryOption[] = [
  { type: "INCOME", l1: "Salary", l2: [], icon: "wallet", color: "#4CAF50" },
  { type: "INCOME", l1: "Other income", l2: [], icon: "wallet", color: "#8BC34A" },
  { type: "EXPENSE", l1: "Groceries", l2: ["Dairy", "Produce", "Staples", "Snacks"], icon: "cart", color: "#F44336" },
  { type: "EXPENSE", l1: "Transport", l2: ["Ride", "Fuel", "Transit"], icon: "car", color: "#FFC107" },
  { type: "EXPENSE", l1: "Food", l2: ["Cafe", "Restaurant"], icon: "utensils", color: "#3F51B5" },
  { type: "EXPENSE", l1: "Housing", l2: ["Rent", "Maintenance"], icon: "home", color: "#CDDC39" },
  { type: "EXPENSE", l1: "Utilities", l2: ["Electric", "Internet", "Phone"], icon: "zap", color: "#03A9F4" },
  { type: "EXPENSE", l1: "Health", l2: ["Pharmacy", "Clinic"], icon: "heart", color: "#00BCD4" },
  { type: "EXPENSE", l1: "Shopping", l2: ["Clothes", "Home"], icon: "bag", color: "#9C27B0" },
];

export function categoriesFor(type: "INCOME" | "EXPENSE", source: CategoryOption[] = CATEGORIES): CategoryOption[] {
  return source.filter((category) => category.type === type);
}

/** Parent row (empty category_l2) owns icon and color. Sub-category rows only add names. */
export function categoriesFromSheet(headers: string[], rows: string[][]): CategoryOption[] {
  const index = (name: string) => headers.indexOf(name);
  const typeIndex = index("type");
  const l1Index = index("category_l1");
  const l2Index = index("category_l2");
  const iconIndex = index("icon");
  const colorIndex = index("color");
  if (l1Index < 0) return [];

  const order: CategoryOption[] = [];
  const byKey = new Map<string, CategoryOption>();

  for (const row of rows) {
    const type = cell(row, typeIndex);
    if (type !== "INCOME" && type !== "EXPENSE") continue;
    const l1 = cell(row, l1Index);
    if (!l1) continue;
    const l2 = cell(row, l2Index);
    const key = `${type}\0${l1}`;
    let category = byKey.get(key);
    if (!category) {
      category = { type, l1, l2: [], icon: DEFAULT_ICON, color: DEFAULT_COLOR };
      byKey.set(key, category);
      order.push(category);
    }
    if (!l2) {
      category.icon = cell(row, iconIndex) || DEFAULT_ICON;
      category.color = cell(row, colorIndex) || DEFAULT_COLOR;
      continue;
    }
    if (!category.l2.includes(l2)) category.l2.push(l2);
  }

  return order;
}

function cell(row: string[], index: number): string {
  if (index < 0) return "";
  return String(row[index] ?? "").trim();
}
