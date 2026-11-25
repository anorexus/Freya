import { useEffect, useState } from "react";
import { CATEGORIES } from "../../../src/data/categories.ts";
import systemIcon from "../assets/icons/system.svg?raw";
import { sampleTransactions } from "../cashflow.js";
import { Button, WalletDropdown, buttonIcons } from "./Button.jsx";
import { CashflowCard } from "./CashflowCard.jsx";
import { CashflowCardV2 } from "./CashflowCardV2.jsx";
import { ExpenseCard } from "./ExpenseCard.jsx";
import { LiquidityCard } from "./LiquidityCard.jsx";
import { Notification } from "./Notification.jsx";
import { TrendCard } from "./TrendCard.jsx";
import { TrendCardV2 } from "./TrendCardV2.jsx";
import { TransactionListCard } from "./TransactionListCard.jsx";
import { TrendCardV3 } from "./TrendCardV3.jsx";
import "./Dashboard.css";
import "./DesignSystem.css";

const WALLETS = [
  { id: "bca", name: "BCA", balance: 12400000 },
  { id: "cash", name: "Main Cash", balance: 4820000 },
  { id: "gopay", name: "GoPay", balance: 1280000 },
];

const SECTIONS = [
  ["docs-color", "Color"],
  ["docs-primitive", "Primitives"],
  ["docs-type", "Typography"],
  ["docs-components", "Components"],
];

const SEMANTIC = [
  ["Background", [
    ["primary", "--background-primary", "Dashboard window, dropdown pane, and the inner amount well on a card."],
    ["secondary", "--background-secondary", "Card shell and card footer. Sits between the window and the recessed track."],
    ["tertiary", "--background-tertiary", "Sidebar, the gutter behind the window, and progress tracks."],
    ["quaternary", "--background-quaternary", "Search field and the darkest wells. Also the ink on a light selected chip."],
  ]],
  ["Outline", [
    ["low", "--outline-low", "Quiet edges: selected menu rows, selected profile, and the card menu border."],
    ["medium", "--outline-medium", "Resting button border, and the shortcut chip on a selected profile."],
    ["high", "--outline-high", "Search focus and the shortcut chip on a selected nav item."],
  ]],
  ["Typography color", [
    ["title", "--typography-title", "Primary text and sidebar icons. Icons stay this color in every nav state."],
    ["body", "--typography-body", "Amount captions on cards, such as “Cashflow” and “Expenses so far”."],
    ["tertiary", "--typography-tertiary", "Running interface text: idle nav labels, card titles, and footer captions."],
    ["inverted", "--typography-inverted", "Text on a light surface, such as the selected trend amount and day."],
    ["positive", "--typography-positive", "Income and a favorable status. Paired with the positive pill fill."],
    ["warning", "--typography-warning", "Caution. The notice notification uses this token."],
    ["negative", "--typography-negative", "Loss, overspending, and a rising expense trend."],
  ]],
  ["Fill", [
    ["primary", "--fill-primary", "Lightest fill. Selected trend stem, node, and day."],
    ["secondary", "--fill-secondary", "Supporting fill. Not a text color."],
    ["tertiary", "--fill-tertiary", "Mid fill for controls that should recede."],
    ["quaternary", "--fill-quaternary", "Darker fill, same value as tertiary type."],
    ["quinary", "--fill-quinary", "Chart stem, node, and unselected day circles."],
    ["positive", "--fill-positive", "Status only. Cyan 50. Not a category color."],
    ["warning", "--fill-warning", "Status only. Yellow 70."],
    ["negative", "--fill-negative", "Status only. Pink 50."],
  ]],
];

const GRADIENTS = [
  ["positive", "--gradient-positive", "Liquidity or cashflow when the level is positive. Leftward, green 50 into light blue 50."],
  ["warning", "--gradient-warning", "Same bars when the level is warning. Leftward, yellow 50 into orange 50."],
  ["negative", "--gradient-negative", "Same bars when the level is negative. Rightward, purple 50 into pink 50."],
];

const FAMILIES = [
  "neutral", "red", "pink", "purple", "deeppurple", "indigo", "blue", "lightblue", "cyan",
  "teal", "green", "lightgreen", "lime", "yellow", "amber", "orange", "deeporange", "brown", "bluegrey",
];

const STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150];

const CATEGORY_TOKENS = {
  Salary: "green/50",
  "Other income": "light green/50",
  Groceries: "red/50",
  Transport: "amber/50",
  Food: "indigo/50",
  Housing: "lime/50",
  Utilities: "light blue/50",
  Health: "cyan/50",
  Shopping: "purple/50",
};

const TYPE = [
  ["Display XL", "display-xl", "Hero banners, splash headlines."],
  ["Display L", "display-l", "Marketing hero titles."],
  ["Display M", "display-m", "Feature highlights, large section headers."],
  ["Heading 1", "heading-h1", "Primary page titles."],
  ["Heading 2", "heading-h2", "Major section headers."],
  ["Heading 3", "heading-h3", "Sub-section headers."],
  ["Heading 4", "heading-h4", "Card group headers, modal headers."],
  ["Title L", "title-l", "Card titles, drawer/sheet headers."],
  ["Title M", "title-m", "Sub-card headers, list section headers."],
  ["Body L", "body-l", "Lead paragraphs, editorial intros."],
  ["Body M medium", "body-m-medium", "Emphasized rows, active menu items, list item titles."],
  ["Body M", "body-m", "Default paragraphs, everyday interface copy."],
  ["Body S medium", "body-s-medium", "Emphasized secondary copy, compact list titles."],
  ["Body S", "body-s", "Supporting copy, secondary descriptions."],
  ["Body XS", "body-xs", "Dense UI copy, table cell descriptions."],
  ["Label L", "label-l", "Primary buttons, active tabs, prominent form labels."],
  ["Label M", "label-m", "Standard buttons, input labels, table headers."],
  ["Label S", "label-s", "Compact buttons, chips, badges, tags."],
  ["Label XS", "label-xs", "Micro-badges, status pills, dense UI counters."],
  ["Caption L", "caption-l", "Default metadata, timestamps, input helper text."],
  ["Caption M", "caption-m", "Chart axis labels, legal disclaimers, footnotes."],
  ["Caption S", "caption-s", "Micro-annotations, bottom-nav tab captions."],
  ["Numeric XL", "numeric-xl", "Largest money figure. Space Grotesk light."],
  ["Numeric L", "numeric-l", "Secondary money figure. Space Grotesk light."],
  ["Numeric M", "numeric-m", "Numeric text at 16. Space Grotesk light."],
  ["Numeric S", "numeric-s", "Compact money. Space Grotesk medium."],
  ["Numeric XS", "numeric-xs", "Smallest money. Space Grotesk medium."],
];

function jump(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function TokenValue({ name, values }) {
  return <code>{values[name] || name}</code>;
}

export function DesignSystem({ onMenu = () => {} }) {
  const [values, setValues] = useState({});

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const names = [
      ...SEMANTIC.flatMap(([, tokens]) => tokens.map(([, name]) => name)),
      ...GRADIENTS.map(([, name]) => name),
      ...FAMILIES.flatMap((family) => STEPS.map((step) => `--${family}-${step}`)),
      ...TYPE.flatMap(([, id]) => ["family", "weight", "size", "line", "tracking"].map((part) => `--type-${id}-${part}`)),
    ];
    const next = {};
    for (const name of names) next[name] = style.getPropertyValue(name).trim();
    setValues(next);
  }, []);

  return (
    <main className="dash docs">
      <header className="dash-bar">
        <Button className="dash-menu" variant="secondary" iconOnly icon={buttonIcons.menu} aria-label="Open menu" onClick={onMenu} />
        <h1 className="dash-title">
          <span className="dash-title-icon" dangerouslySetInnerHTML={{ __html: systemIcon }} />
          Design system
        </h1>
      </header>
      <div className="docs-body">
        <div className="docs-intro">
          <p className="docs-lead">
            Tokens come from the primitive, semantic, and typography files. Color carries meaning: status is never reused as a category color, and category colors stay on primitive step 50.
          </p>
          <nav className="docs-jump" aria-label="On this page">
            {SECTIONS.map(([id, label]) => (
              <button key={id} type="button" onClick={() => jump(id)}>{label}</button>
            ))}
          </nav>
        </div>

        <section id="docs-color" className="docs-section">
          <div className="docs-head">
            <h2>Color</h2>
            <p>Semantic tokens are the ones product UI should use. They point at a primitive, so a palette change stays in one place.</p>
          </div>
          {SEMANTIC.map(([group, tokens]) => (
            <div key={group} className="docs-group">
              <div className="docs-head">
                <h3>{group}</h3>
              </div>
              <ul className="docs-tokens">
                {tokens.map(([label, name, usage]) => (
                  <li key={name}>
                    <span className="docs-chip" style={{ background: `var(${name})` }} />
                    <div>
                      <p className="docs-token-name">{label}</p>
                      <p className="docs-token-meta"><code>{name}</code> <TokenValue name={name} values={values} /></p>
                      <p className="docs-usage">{usage}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="docs-group">
            <div className="docs-head">
              <h3>Gradients</h3>
              <p>Progress bars only. Liquidity and cashflow pick one from their existing level logic. Expense categories stay solid.</p>
            </div>
            <ul className="docs-tokens">
              {GRADIENTS.map(([label, name, usage]) => (
                <li key={name}>
                  <span className="docs-chip is-bar" style={{ background: `var(${name})` }} />
                  <div>
                    <p className="docs-token-name">{label}</p>
                    <p className="docs-token-meta"><code>{name}</code></p>
                    <p className="docs-usage">{usage}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="docs-primitive" className="docs-section">
          <div className="docs-group">
          <div className="docs-head">
            <h2>Color primitives</h2>
            <p>Each family runs from 0, the lightest, to 150, the darkest. Step 50 is the bright working color. Positive is cyan 50, warning is yellow 70, and negative is pink 50.</p>
          </div>
          <ul className="docs-ramps">
            {FAMILIES.map((family) => (
              <li key={family}>
                <p>{family}</p>
                <div className="docs-ramp">
                  {STEPS.map((step) => (
                    <span key={step} style={{ background: `var(--${family}-${step})` }} title={`${family}/${step} ${values[`--${family}-${step}`] || ""}`}>
                      {step === 50 || step === 70 ? step : ""}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          </div>
          <div className="docs-group">
            <div className="docs-head">
              <h3>Category colors</h3>
              <p>Categories are data, not status. Each one is locked to a primitive 50. The expense bar uses these as solid segments.</p>
            </div>
            <ul className="docs-tokens">
            {CATEGORIES.map((category) => (
              <li key={category.l1}>
                <span className="docs-chip" style={{ background: category.color }} />
                <div>
                  <p className="docs-token-name">{category.l1}</p>
                  <p className="docs-token-meta">{CATEGORY_TOKENS[category.l1]} <code>{category.color}</code></p>
                  <p className="docs-usage">{category.type === "INCOME" ? "Income category." : "Expense category."}</p>
                </div>
              </li>
            ))}
          </ul>
          </div>
        </section>

        <section id="docs-type" className="docs-section">
          <div className="docs-group">
            <div className="docs-head">
              <h2>Typography</h2>
              <p>Interface text is Manrope. Money is Space Grotesk. Each sample below is set in its own token, not in the page’s body style.</p>
            </div>
            <ul className="docs-type">
            {TYPE.map(([label, id, usage]) => {
              const numeric = id.startsWith("numeric");
              const size = values[`--type-${id}-size`];
              const weight = values[`--type-${id}-weight`];
              const line = values[`--type-${id}-line`];
              const family = (values[`--type-${id}-family`] || "").replaceAll("\"", "").split(",")[0].trim();
              return (
                <li key={id}>
                  <p className="docs-token-name">{label}</p>
                  <p
                    className="docs-sample"
                    style={{
                      fontFamily: `var(--type-${id}-family)`,
                      fontWeight: `var(--type-${id}-weight)`,
                      fontSize: `var(--type-${id}-size)`,
                      lineHeight: `var(--type-${id}-line)`,
                      letterSpacing: `var(--type-${id}-tracking)`,
                    }}
                  >
                    {numeric ? "Rp18,500,000" : "Freya keeps the books"}
                  </p>
                  <p className="docs-token-meta docs-type-meta">
                    {`${family} ${size || ""} / ${weight || ""} / ${line || ""}`}
                  </p>
                  <p className="docs-usage">{usage}</p>
                </li>
              );
            })}
            </ul>
          </div>
        </section>

        <section id="docs-components" className="docs-section">
          <div className="docs-head">
            <h2>Components</h2>
          </div>
          <div className="docs-group">
            <div className="docs-head">
              <h3>Button</h3>
              <p>Secondary is the quiet action, used for Sync. Primary is the single strong action, Add transaction. Navigation is the 28px pager used for months and trend columns. Disabled sits on every variant and removes the action.</p>
            </div>
            <div className="docs-stage">
              <Button variant="secondary" icon={buttonIcons.sync}>Sync</Button>
              <Button variant="primary" icon={buttonIcons.add}>Add transaction</Button>
              <Button variant="navigation" icon={buttonIcons.arrowRight} aria-label="Next" />
              <Button variant="secondary" disabled>Disabled</Button>
            </div>
          </div>
          <div className="docs-group">
            <div className="docs-head">
              <h3>Dropdown</h3>
              <p>Every menu uses the wallet pane: 250px, 16px radius, primary background, 12px rows. Clicking outside, or pressing Escape, closes it and keeps the current choice.</p>
            </div>
            <div className="docs-stage">
              <WalletDropdown wallets={WALLETS} />
            </div>
          </div>
          <div className="docs-group">
            <div className="docs-head">
              <h3>Notification</h3>
              <p>Sheet and sync messages. The notice tone uses the warning token. Positive and negative use their own status tokens. The bar hugs its text.</p>
            </div>
            <div className="docs-stack">
              <Notification tone="notice" title="Row excluded.">Invalid amount. Fix it in the sheet, then sync.</Notification>
              <Notification tone="positive" title="Sheet synced.">Transactions are up to date.</Notification>
              <Notification tone="negative" title="Logging is paused.">The sheet headers no longer match.</Notification>
            </div>
          </div>
          <div className="docs-group">
            <div className="docs-head">
              <h3>Summary cards</h3>
              <p>The shell is secondary, 24px radius. The amount well is primary. Labels use typography body. The large figure is Numeric XL. A double-click on a money amount copies it and shows a “Copied !” toast. Percentages, dates, and years do not copy.</p>
            </div>
            <div className="docs-cards">
              <LiquidityCard wallets={WALLETS} />
              <CashflowCard transactions={sampleTransactions()} />
              <ExpenseCard transactions={sampleTransactions()} categories={CATEGORIES} />
            </div>
          </div>
          <div className="docs-group">
            <div className="docs-head">
              <h3>Progress</h3>
              <p>Liquidity and cashflow fills are 8px inside a 16px track. Width and level stay on the existing rules. Only the paint changes: positive, warning, or negative gradient. Category segments keep their primitive 50 colors and do not use those gradients.</p>
            </div>
          </div>
          <div className="docs-group">
            <div className="docs-head">
              <h3>Trend</h3>
              <p>Columns page by one day or one month. The stem and the node have no inner shadow. The day and month circles keep theirs. The selected column uses the light fill with inverted type.</p>
            </div>
            <div className="docs-cards is-wide">
              <TrendCard transactions={sampleTransactions()} />
            </div>
          </div>
          <div className="docs-group">
            <div className="docs-head">
              <h3>Trend v2</h3>
              <p>Capsule columns. The weekday sits inside the bar and the date sits under it. Selecting a column replaces the capsule with a light fade, a white stem, and an inverted day circle, and puts the compact amount in a chip above. Daily pages by one day and Monthly by one month. The latest point in the window starts selected. A rise in spending uses the negative pill. The cashflow card stays on months. It draws two bars on the same column. The black bar is income and the transparent bar is expense. When expense is higher, it rises above the income bar. The amount pill is income minus expense, and transfers stay out. A rise in that cashflow uses the positive pill.</p>
            </div>
            <div className="docs-cards is-pair">
              <TrendCardV2 transactions={sampleTransactions()} />
              <TrendCardV2 transactions={sampleTransactions()} kind="cashflow" />
            </div>
          </div>
          <div className="docs-group">
            <div className="docs-head">
              <h3>Spending trend v3</h3>
              <p>Capsule columns with the weekday inside the bar and the date under it. The shortest bar stays 44px and drops its stem. Selecting a column fades that column, turns the stem white, and sticks a compact amount pill to the top of the bar. Average spending and its trend follow the days or months on the graph. Daily shows seven days, and each step moves that window by one day. Monthly paging stays inside one year. The latest point starts selected. A rise in spending uses the negative pill.</p>
            </div>
            <div className="st3-preview">
              <TrendCardV3 transactions={sampleTransactions()} />
              <TrendCardV3 transactions={sampleTransactions()} />
            </div>
          </div>
          <div className="docs-group">
            <div className="docs-head">
              <h3>Transaction list</h3>
              <p>The shell is secondary, with a 24px top radius and a 16px bottom radius. Each row sits on the primary well. The mark uses that category’s primitive color. A credit amount is prefixed with + and uses the positive type color. A note, when present, follows the date after a dot and truncates.</p>
            </div>
            <div className="docs-cards">
              <TransactionListCard transactions={sampleTransactions()} />
            </div>
          </div>
          <div className="docs-group">
            <div className="docs-head">
              <h3>Cashflow trend v2</h3>
              <p>At least six months of the current year. A wider card adds another month for every 76px of chart width, up to twelve. The black bar is income and the gradient bar is expense. Expense can rise above income, and the amount chip follows the taller bar. Paging stays inside this year. The track only shows position. The latest month starts selected. A rise in cashflow uses the positive pill.</p>
            </div>
            <div className="cf2-preview">
              <CashflowCardV2 transactions={sampleTransactions()} />
              <CashflowCardV2 transactions={sampleTransactions()} />
            </div>
          </div>
          <div className="docs-group">
            <div className="docs-head">
              <h3>Sidebar</h3>
              <p>Expanded width is 280px. Collapsed width is 88px. Icons stay on the left while the label and shortcut fade. The sidebar surface is background tertiary, the same color as the gutter behind this window.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
