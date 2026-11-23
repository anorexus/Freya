export type CategoryOption = {
  type: "INCOME" | "EXPENSE";
  l1: string;
  l2: string[];
  color: string;
};

export const CATEGORIES: CategoryOption[] = [
  { type: "INCOME", l1: "Salary", l2: [], color: "#4CAF50" },
  { type: "INCOME", l1: "Other income", l2: [], color: "#8BC34A" },
  { type: "EXPENSE", l1: "Groceries", l2: ["Dairy", "Produce", "Staples", "Snacks"], color: "#F44336" },
  { type: "EXPENSE", l1: "Transport", l2: ["Ride", "Fuel", "Transit"], color: "#FFC107" },
  { type: "EXPENSE", l1: "Food", l2: ["Cafe", "Restaurant"], color: "#3F51B5" },
  { type: "EXPENSE", l1: "Housing", l2: ["Rent", "Maintenance"], color: "#CDDC39" },
  { type: "EXPENSE", l1: "Utilities", l2: ["Electric", "Internet", "Phone"], color: "#03A9F4" },
  { type: "EXPENSE", l1: "Health", l2: ["Pharmacy", "Clinic"], color: "#00BCD4" },
  { type: "EXPENSE", l1: "Shopping", l2: ["Clothes", "Home"], color: "#9C27B0" },
];

export function categoriesFor(type: "INCOME" | "EXPENSE"): CategoryOption[] {
  return CATEGORIES.filter((category) => category.type === type);
}
