import type { StoredRow } from "./types";

/**
 * Day-1 sheet contract from the product plan.
 * Users may edit cells. They may not rename these headers, add or delete columns, or add tabs.
 * wallet_id and beneficiary are reserved now and used in later milestones.
 */
export const TRANSACTION_HEADERS = [
  "transaction_id",
  "date",
  "type",
  "amount",
  "category_l1",
  "category_l2",
  "item_name",
  "notes",
  "wallet_id",
  "beneficiary",
] as const satisfies readonly (keyof StoredRow)[];

export const CATEGORY_HEADERS = ["type", "category_l1", "category_l2", "icon", "color", "monthly_budget"] as const;

export const WALLET_HEADERS = [
  "asset_id",
  "name",
  "asset_class",
  "current_value",
  "last_updated",
  "notes",
] as const;

export const SHEET_TABS = ["Transactions", "Config_Categories", "Assets_Wallets"] as const;

export type SchemaCheck = {
  ok: boolean;
  message: string | null;
};

export function validateSheet(input: { tabs: string[]; headers: string[]; categoryHeaders: string[] }): SchemaCheck {
  const expectedTabs = new Set<string>(SHEET_TABS);
  const extraTabs = input.tabs.filter((tab) => !expectedTabs.has(tab));
  const missingTabs = SHEET_TABS.filter((tab) => !input.tabs.includes(tab));

  if (extraTabs.length > 0) {
    return {
      ok: false,
      message: `Remove the extra tab ${extraTabs[0]}. Freya only reads Transactions, Config_Categories, and Assets_Wallets.`,
    };
  }

  if (missingTabs.length > 0) {
    return {
      ok: false,
      message: `The sheet is missing the ${missingTabs[0]} tab. Restore the Freya template to log new rows.`,
    };
  }

  const transactions = headerCheck(input.headers, TRANSACTION_HEADERS, "Transactions");
  if (transactions) return transactions;

  const categories = headerCheck(input.categoryHeaders, CATEGORY_HEADERS, "Config_Categories");
  if (categories) return categories;

  return { ok: true, message: null };
}

function headerCheck(actual: string[], expected: readonly string[], tab: string): SchemaCheck | null {
  if (actual.length === expected.length && actual.every((header, index) => header === expected[index])) return null;
  const missing = expected.filter((header) => !actual.includes(header));
  const detail = missing.length > 0 ? `${tab} is missing ${missing[0]}.` : `${tab} headers are out of order or renamed.`;
  return {
    ok: false,
    message: `Sheet headers no longer match Freya. ${detail} Restore the template headers to log new rows. Reading still works.`,
  };
}
