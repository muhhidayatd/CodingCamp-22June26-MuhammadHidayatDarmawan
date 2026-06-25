# Project Structure

```
/
├── index.html          # Single HTML entry point
├── css/
│   └── style.css       # Only CSS file (one file rule enforced)
├── js/
│   └── app.js          # Only local JS file (one file rule enforced)
└── .kiro/
    ├── specs/
    │   └── expense-budget-visualizer/
    │       ├── requirements.md
    │       ├── design.md
    │       └── .config.kiro
    └── steering/
        ├── product.md
        ├── tech.md
        └── structure.md
```

## File Responsibilities

### `index.html`
- Loads `css/style.css` via `<link>`
- Loads Chart.js from CDN via `<script>`
- Loads `js/app.js` via `<script>`
- Declares all DOM elements referenced by JS (form, list, balance display, chart canvas, warning toast)

### `css/style.css`
- All styles for the app — layout, components, responsive breakpoints
- Responsive from 320px to 2560px with no horizontal overflow

### `js/app.js`
- All JavaScript logic in one file, organized into logical sections:
  - **Data model** — `Transaction` type, constants (categories, colors, storage key)
  - **State manager** — `transactions` array, `addTransaction`, `deleteTransaction`, `getTransactions`
  - **Storage module** — `loadFromStorage`, `saveToStorage` (localStorage wrapped in try/catch)
  - **Validator** — `validateForm` returning `{ valid, errors }`
  - **UI renderer** — `render`, `renderTransactionList`, `renderBalance`, `renderChart`
  - **Utilities** — `formatCurrency`, `summarizeByCategory`
  - **Toast** — `showWarning`
  - **Init** — app bootstrap on `DOMContentLoaded`

## Naming Conventions

- HTML element IDs: `kebab-case` (e.g., `transaction-form`, `balance-display`, `spending-chart`)
- CSS classes: `kebab-case` (e.g., `btn-delete`, `tx-name`, `error-msg`, `toast`)
- JS functions: `camelCase`
- JS constants: `UPPER_SNAKE_CASE` for fixed values (e.g., `STORAGE_KEY`, `CATEGORY_COLORS`)
- Transaction `id`: `"<timestamp>-<random digits>"` string

## Key DOM Element IDs

| ID                  | Element     | Purpose                        |
|---------------------|-------------|--------------------------------|
| `transaction-form`  | `<form>`    | Add transaction form           |
| `input-name`        | `<input>`   | Item name field                |
| `input-amount`      | `<input>`   | Amount field                   |
| `input-category`    | `<select>`  | Category selector              |
| `transaction-list`  | `<ul>`      | Scrollable transaction list    |
| `balance-display`   | `<p>`/`<span>` | Total balance            |
| `spending-chart`    | `<canvas>`  | Chart.js pie chart             |
| `chart-placeholder` | `<p>`       | "No data" message when empty   |
| `warning-toast`     | `<div>`     | Dismissible localStorage error |
