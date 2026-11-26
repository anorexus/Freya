# Changelog

## 2026-11-26 — Go stays separate from deploy

- Keep Go as branch, changelog, commit, and merge. Push stays a separate command so the Pages site does not update on every Go.
- Leave local `mocks/` untracked.

## 2026-11-26 — Spending by category

- Add a spending-by-category card on the dashboard: a half ring of this month’s expenses, with rows that highlight the matching slice.
- Use checkboxes for people on the add-transaction card, and split category rows so the name expands and the control selects.

## 2026-11-26 — Calendar and add transaction

- Add a calendar on the dashboard that follows the selected month, and let the cashflow and spending trends page with that same focus.
- Replace the add-transaction dialog with a card that steps through expense, income, and transfer, including category, account, and beneficiary.
- Add a nude button and soften the pressed state on transaction rows.

## 2026-11-25 — Accounts page

- Add an Accounts page and rename Wallets to Accounts in the nav, liquidity card, and add-transaction form.
- Cap the dashboard width, keep the top bar sticky with a scroll shadow, and hide the dashboard and sidebar scrollbars.
- Lock page zoom on the library viewport.

## 2026-11-25 — Transactions page

- Add a Transactions page so “See more” on the dashboard opens the full month, grouped by day, with search.
- Always branch, commit, and merge when Go is said. Push stays out of that sequence.

## 2026-11-25

- Add an Add transaction dialog on the dashboard so a new expense, income, or transfer can be drafted without leaving the page.
- Register a close icon for that dialog.
- Split the sidebar logo into a brand control that opens the dashboard (or expands a collapsed sidebar) and a separate collapse control. Hide the collapse key while the sidebar is a drawer.
- Record the Go workflow so a later “Go” fetches, branches, writes this changelog, commits, and merges.
