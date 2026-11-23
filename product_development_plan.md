# Product Development Plan: Personal Financial Dashboard & Tracker

## 1. Google Sheets Database Schema (Contract)
To prevent schema breakage across milestones, initialize the Google Sheet with fixed tabs and reserved columns from Day 1. Users may bulk-edit rows within these columns, **but must not rename headers, add/delete columns, or add custom tabs**.

### Tab 1: `Transactions`
| Column | Header | Type / Format | Required | Milestone | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| A | `transaction_id` | UUID / String | Yes | M1 | Groups multiple SKU rows belonging to a single receipt/transaction. |
| B | `date` | `YYYY-MM-DD` | Yes | M1 | Transaction date. |
| C | `type` | `INCOME` \| `EXPENSE` \| `TRANSFER` | Yes | M1 (M2 for Transfer) | Cashflow direction. |
| D | `amount` | Number | Yes | M1 | Line-item amount (always positive; sign determined by `type`). |
| E | `category_l1` | String | Yes | M1 | Primary category (e.g., `Groceries`, `Salary`, `Transport`). |
| F | `category_l2` | String | No | M1 | Sub-category / SKU group (e.g., `Dairy`, `Produce`, `Snacks`). |
| G | `item_name` | String | No | M1 | Specific SKU/item description (e.g., `Fresh Milk 1L`). |
| H | `notes` | String | No | M1 | General receipt or transaction-level notes. |
| I | `wallet_id` | String | Yes (Default: `Main Cash`) | M2 | Source/destination wallet or account identifier. |
| J | `beneficiary` | String | Yes (Default: `Self`) | M4 | Who the expense was for (`Self`, `Spouse`, `Child`, etc.). |

### Tab 2: `Config_Categories`
* Columns: `type` (`INCOME`/`EXPENSE`), `category_l1`, `category_l2`, `color` (hex for that category in charts), `monthly_budget` (used in M3).

### Tab 3: `Assets_Wallets` *(Introduced in M2)*
* Columns: `asset_id`, `name`, `asset_class` (`CASH`, `STOCK`, `CRYPTO`, `PROPERTY`, `VEHICLE`), `current_value`, `last_updated`, `notes`.

---

## 2. Phased Development Roadmap

### Milestone 1: Core Ledger, SKU Granularity & Cashflow Dashboard (MVP)
**Goal:** Enable fast logging of single or multi-SKU transactions, safe bulk editing in Google Sheets, and core trend visualization.

#### Features & User Flows
1. **Auth & Sheet Initialization:**
   * Google OAuth login + Connect existing Sheet (via Google Picker) or Auto-create new Sheet from template.
   * **Schema Guardrail:** On every fetch, validate that Tab 1 headers match the expected contract. If a user alters headers or adds unauthorized tabs, block write operations and display a clear schema-repair alert.
2. **Transaction & SKU-Level Entry (Read/Write):**
   * **Single-Item Mode:** Quick entry for standard transactions (`Date`, `Type`, `Amount`, `L1 Category`, optional `L2 Category`, optional `Notes`). Generates 1 row with a unique `transaction_id`.
   * **Multi-SKU Receipt Mode:** Add multiple line items under one receipt (e.g., a supermarket trip). Each line item has its own `Amount`, `L1 Category`, `L2 Category`, and `Item Name`, sharing the same `transaction_id`, `Date`, and `Notes`.
3. **Transaction History & Rollup View:**
   * Default list groups rows by `transaction_id`, showing the summed total and `L1 Category` summary.
   * Expanding a transaction reveals individual SKU rows and `L2 Category` breakdowns.
   * Dedicated **Category Drill-down** filter/view to inspect total spending by `L2 Category` across any date range.
4. **Analytics Dashboard:**
   * **6-Month Cashflow Overlay Chart:** Grouped/overlaid bar or line chart comparing total `INCOME` vs. `EXPENSE` per month for the trailing 6 months.
   * **7-Day Daily Expense Trend:** Daily bar/line chart showing `EXPENSE` only over the last 7 days.

#### UI States & Edge Cases
* **Empty State:** First-time user with 0 rows sees sample placeholder charts and a primary CTA to log their first transaction.
* **Dirty Sheet Data (Bulk Edit):** If a user manually enters non-numeric text in `amount` or an invalid date format in Google Sheets, flag the specific row number in a non-blocking warning banner ("Row 14 has an invalid amount and was excluded from totals") rather than crashing the dashboard.
* **Out of Scope (M1):** Wallet balances, transfers, budgets, beneficiary tracking, recurring transactions.

---

### Milestone 2: Multi-Wallet Cashflow & Net Worth Asset Tracking
**Goal:** Track where cash sits across multiple accounts and expand into a holistic net worth view covering illiquid and investment assets.

#### Features & User Flows
1. **Multi-Cash Wallet Support:**
   * Manage multiple cash accounts (e.g., Bank Accounts, E-Wallets, Physical Cash) in `Assets_Wallets` (`asset_class = CASH`).
   * Require selecting a `wallet_id` when logging Income or Expense.
   * Support `TRANSFER` transaction type (moves funds between two `wallet_id`s without inflating Income or Expense charts).
   * Display live balance per wallet (Initial Balance + Sum of Wallet Income − Sum of Wallet Expense ± Transfers).
2. **Non-Cash Asset Classes (Net Worth Expansion):**
   * Support tracking **Stocks**, **Crypto**, **Properties**, and **Vehicles** in `Assets_Wallets`.
   * Manual valuation update flow (updates `current_value` and `last_updated` timestamp) rather than transaction-by-transaction ledger entries.
   * **Net Worth Summary Card & Breakdown:** Total Liquid Cash + Total Investments/Fixed Assets, broken down by asset class.
* **Out of Scope (M2):** Automated live stock/crypto price feeds (keep manual valuation updates in Sheets/UI first), debt/loan amortization schedules.

---

### Milestone 3: Category-Based Budgeting
**Goal:** Set monthly spending targets and monitor real-time burn rates against limits.

#### Features & User Flows
1. **Budget Configuration:**
   * Set monthly budget caps per `L1 Category` (stored in `Config_Categories` tab).
2. **Budget Progress & Burn Rate UI:**
   * Visual progress bars per category for the active month (`Actual Spent / Budget Limit`).
   * Color-coded threshold alerts: Normal (under 80%), Warning (80%–99%), Over Budget (100%+).
   * **Pacing Indicator:** Compare % of budget spent vs. % of days elapsed in the current month.
* **Out of Scope (M3):** Budget rollover from previous months, `L2 Category`-level budget caps.

---

### Milestone 4: Beneficiary / "Spent For" Tracking
**Goal:** Separate personal consumption from spending made on behalf of family members or other people.

#### Features & User Flows
1. **Beneficiary Tagging (Transaction & SKU Level):**
   * Add a `Beneficiary` selector (e.g., `Self`, `Spouse`, `Son`, `Parents`, plus custom tags) on both standard transactions and individual SKU lines (e.g., buying groceries where some SKUs are for `Self` and baby supplies are for `Son`).
2. **Beneficiary Analytics & Filtering:**
   * Global dashboard filter to toggle between **All Spending**, **Self Only**, or **Specific Person**.
   * Summary breakdown showing total and % of monthly expenses spent per person.
* **Out of Scope (M4):** Split-bill debt settlement / reimbursement tracking (IOUs).

---

### Milestone 5: Neutral movement, currencies, and amount display
**Goal:** Record money that is neither income nor expense, support a main currency plus foreign currencies, and show amounts as `Rp 1,000`.

Recorded only. Not part of M1–M4.

#### Features
1. **Neutral money movement.**
   * A movement that is neither income nor expense, so it does not change income, expense, or net.
   * M2 already names this `TRANSFER` between two `wallet_id`s. This milestone keeps that rule: transfers stay out of the income and expense charts.
2. **Multiple currencies.**
   * Settings page: choose the main currency. Default `IDR`.
   * New sheet tab `Config_Currencies` for foreign currencies only. Columns: `currency_code`, `symbol`, `rate_to_main`, `updated_at`.
   * `rate_to_main` is how many main-currency units equal 1 foreign unit (example: `1 USD = 16000 IDR`).
   * Dashboard totals stay in the main currency, converted with that rate.
3. **Thousands separator.**
   * Show a comma after each thousand: `1,000` and `16,000.50`.
   * Do not use the Indonesian dot grouping (`1.000`).
4. **Currency prefix.**
   * Show the currency symbol before the amount. For rupiah, `Rp 1,000`.
   * The prefix follows the main currency in Settings, or the foreign currency on a foreign-currency amount.