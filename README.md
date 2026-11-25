# Freya

Personal financial dashboard for logging income and expenses, then reading the month back as cashflow. The ledger can live in the browser, or in a Google Sheet that Freya creates and you can bulk-edit yourself.

Live site: [anorexus.github.io/Freya](https://anorexus.github.io/Freya/)

Mock dashboard: [anorexus.github.io/Freya/library](https://anorexus.github.io/Freya/library/)

## What you can do

- See the current month’s income, expense, and net, plus a 6-month cashflow chart and a 7-day expense chart.
- Browse receipts grouped by month, and filter them by income or expense.
- Log a single transaction or a multi-line receipt.
- Load a sample ledger, or keep your own in this browser.
- Sign in with Google and create a Freya ledger spreadsheet. Freya only asks for access to files it creates. Sync pulls the latest rows from that sheet.

A row with a broken amount or date is left out of the totals and called out on the dashboard. Fix it in the sheet, then sync.

## Run it locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app opens at [http://localhost:5173](http://localhost:5173). Google sign-in needs `VITE_GOOGLE_CLIENT_ID` in `.env.local`, and that origin listed on the OAuth client. Without a client ID, the local ledger still works.

The component library is a separate preview in `library/`. From that folder, run `npm install` and `npm run dev`.

## Change log

- **Publish the mock dashboard on GitHub Pages.** The component library builds into `/Freya/library/` on the same Pages site as the app.
- **Add the Freya dashboard scaffold, design system, and product specs.** First baseline: Vite and React dashboard, transaction log, categories, design tokens, and the product spec.
- **Publish Freya on GitHub Pages.** Host the site from this repo, and add Google sign-in plus creating and reading a Freya sheet.
- **Group transactions by month and create the ledger through Drive.** Month pager on the transactions page. Sheet creation uses Drive’s `drive.file` scope, asks again if that permission is missing, and removes the file if setup fails.
- **Add the dashboard card library and category colors.** Preview liquidity, cashflow, and expense cards. Each category gets a chart color, stored on the sheet category tab. The product plan records a later milestone for neutral transfers, currencies, and amount formatting.
- **Assemble the component library dashboard.** Sidebar, buttons, notifications, and a spending trend card, shown as a dashboard with a year of sample transactions. Other income uses light green.
- **Bring Figma tokens into the component library.** Primitive and semantic colors from the Figma token files, documented on a design-system page. Amounts copy on double-click. Sidebar and buttons follow the new tokens, including a collapsible nav and a mobile menu.
- **Hold the compact library layout until 1024px.** Sidebar, dashboard, notifications, and the design-system page stay in the narrow layout below desktop width. The mobile menu stays available until the window reaches that width.
- **Revise the spending trend and fill a year of sample data.** A shared pill, trend v2 for expense and cashflow, and trend v3 on the dashboard. Daily windows step by one day, and cashflow leaves transfers out. The sample ledger covers a full year with an expense every day, salary on the 25th, and amounts of at least 20k. Background colors point at the neutral primitives.
- **Add a cashflow trend and a transaction list.** Cashflow v2 shows at least six months of the year, with income and expense bars and a step track. The transaction list shows the month’s rows in their category colors. Chart tips and the step track are shared, and the spending trend uses them.
