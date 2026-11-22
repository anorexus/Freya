export type CategoryOption = {
  type: "INCOME" | "EXPENSE";
  l1: string;
  l2: string[];
};

export const CATEGORIES: CategoryOption[] = [
  { type: "INCOME", l1: "Salary", l2: [] },
  { type: "INCOME", l1: "Other income", l2: [] },
  { type: "EXPENSE", l1: "Groceries", l2: ["Dairy", "Produce", "Staples", "Snacks"] },
  { type: "EXPENSE", l1: "Transport", l2: ["Ride", "Fuel", "Transit"] },
  { type: "EXPENSE", l1: "Food", l2: ["Cafe", "Restaurant"] },
  { type: "EXPENSE", l1: "Housing", l2: ["Rent", "Maintenance"] },
  { type: "EXPENSE", l1: "Utilities", l2: ["Electric", "Internet", "Phone"] },
  { type: "EXPENSE", l1: "Health", l2: ["Pharmacy", "Clinic"] },
  { type: "EXPENSE", l1: "Shopping", l2: ["Clothes", "Home"] },
];

export function categoriesFor(type: "INCOME" | "EXPENSE"): CategoryOption[] {
  return CATEGORIES.filter((category) => category.type === type);
}
