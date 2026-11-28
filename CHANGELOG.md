# Changelog

## 2026-11-28 — Wallet bar and spending tap

- Show the wallet dropdown in the dashboard and transactions bar, and label the empty choice “All wallets”.
- On a narrow screen or a touch device, a spending slice stays selected until the next tap.

## 2026-11-27 — Category icons and one account button

- Read each category’s icon and color from the sheet. The parent row owns them, and sub-category rows only add names.
- Check `Config_Categories` headers the same way as `Transactions`, including the new `icon` column.
- Show Login with Google or Sign out, not both. Simulation sign-out returns to the login card.
- Name the current site in the Google sign-in error when the window is blocked.

## 2026-11-27 — Auth card props

- Make the secondary action and sign-out optional so the create-ledger card typechecks and Pages can build.

## 2026-11-27 — Login gate

- Open on a login card: Google sign-in, or a simulation that stays in this browser.
- After sign-in, create the Freya sheet when none is linked, then enter the app.
- Replace the sidebar profile with Login with Google and Sign out.

## 2026-11-27 — Retire the mock site

- Stop publishing the library preview at `/freya/library/`. The app already uses those components.

## 2026-11-27 — Rotated site icon

- Rotate the Freya mark 45 degrees in the favicon and regenerate the raster sizes.

## 2026-11-27 — Site icons

- Add the Freya favicon, Apple touch icon, and web manifest so the installed site uses the mark on a `#0e0e10` background.

## 2026-11-27 — Library shell in the app

- Use the library sidebar, dashboard, and transactions page in the app, with the live ledger for sync, accounts, and new transactions.
- Let the account dropdown be controlled, and open the design system from the same shell.
- Load Manrope and Space Grotesk on the app, and allow JavaScript imports from the library.

## 2026-11-27 — Pages base path

- Serve the app and library from `/freya/` so the renamed GitHub Pages site can load its script and styles.

## 2026-11-27 — Card progress polish

- Soften the shared progress bar and show all three levels in the design system.
- Rename the liquidity card to Overall balance and place the period dates above the bar.
- Fade expense segments by category color. Hovering a spending slice replaces the center total, and row amounts use a compact figure.
- Drop the summary cards from the transactions page.

## 2026-11-27 — Progress bar and spending chart

- Share one progress bar on the liquidity and cashflow cards.
- Limit the spending ring to the top five categories plus Others, and sit it beside the spending trend.
- Add Numeric XXL at 40 and move Numeric XL to 32.

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
