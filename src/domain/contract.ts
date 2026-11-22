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

export const CATEGORY_HEADERS = ["type", "category_l1", "category_l2", "monthly_budget"] as const;

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

export function validateSheet(input: { tabs: string[]; headers: string[] }): SchemaCheck {
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

  const expected = TRANSACTION_HEADERS as readonly string[];
  if (input.headers.length !== expected.length || input.headers.some((header, index) => header !== expected[index])) {
    const missing = expected.filter((header) => !input.headers.includes(header));
    const detail = missing.length > 0 ? `Transactions is missing ${missing[0]}.` : "Transactions headers are out of order or renamed.";
    return {
      ok: false,
      message: `Sheet headers no longer match Freya. ${detail} Restore the template headers to log new rows. Reading still works.`,
    };
  }

  return { ok: true, message: null };
}
