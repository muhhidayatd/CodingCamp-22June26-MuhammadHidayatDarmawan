# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a fully client-side expense tracker in three files (`index.html`, `css/style.css`, `js/app.js`) with no build step. The implementation order follows the data-flow architecture: HTML scaffolding → JS data layer → JS logic (validator, state, storage) → UI renderer → Chart integration → styling and responsive layout. Each task is independently executable and leaves the app in a runnable state.

---

## Tasks

- [x] 1. Scaffold HTML structure in `index.html`
  - Create `index.html` with `<!DOCTYPE html>`, `<html lang="en">`, `<head>` (charset, viewport, title, `<link>` to `css/style.css`), and `<body>`
  - Add `<link rel="stylesheet" href="css/style.css">` as the only stylesheet reference
  - Add Chart.js CDN `<script>` tag before the closing `</body>` (use a pinned version, e.g., `https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js`)
  - Add `<script src="js/app.js" defer></script>` as the only local JS reference
  - Add the form (`<form id="transaction-form">`) containing:
    - `<input id="input-name" type="text" maxlength="100" required>`
    - `<input id="input-amount" type="number" min="0.01" max="999999999.99" step="0.01" required>`
    - `<select id="input-category">` with `<option>` values: Food, Transport, Fun
    - A `<button type="submit">` to add the transaction
    - Placeholder `<span class="error-msg">` slots (initially empty) after each field
  - Add `<p id="balance-display">$0.00</p>` for the total balance
  - Add `<ul id="transaction-list"></ul>` for the scrollable transaction list
  - Add `<canvas id="spending-chart"></canvas>` and `<p id="chart-placeholder">No data to display</p>` for the chart
  - Add `<div id="warning-toast" class="toast hidden">` with a close `<button>` inside it for the dismissible toast
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 2. Implement data model constants and utilities in `js/app.js`
  - [x] 2.1 Define constants and Transaction typedef
    - Create `js/app.js` with `'use strict';`
    - Define `STORAGE_KEY = 'expense-visualizer-transactions'`
    - Define `CATEGORY_COLORS = { Food: '#4CAF50', Transport: '#2196F3', Fun: '#FF9800' }`
    - Define `CATEGORIES = ['Food', 'Transport', 'Fun']`
    - Add JSDoc `@typedef` for `Transaction` (`id`, `name`, `amount`, `category`, `timestamp`)
    - _Requirements: 1.1, 4.6_

  - [x] 2.2 Implement `formatCurrency(value)`
    - Return a string formatted as `$x,xxx.xx` using `toLocaleString('en-US', { style: 'currency', currency: 'USD' })` or equivalent manual formatting
    - Handle `0` → `"$0.00"`, `1234.56` → `"$1,234.56"`, `999999999.99` → `"$999,999,999.99"`
    - _Requirements: 2.1, 3.1, 3.7_

  - [x] 2.3 Implement `summarizeByCategory(transactions)`
    - Accept a `Transaction[]`, group amounts by `category`, compute `total` per category and `percentage` = `(categoryTotal / grandTotal) * 100`
    - Return only categories with at least one transaction
    - For an empty array return `[]`
    - Round the grand total using `parseFloat(total.toFixed(2))` to avoid floating-point drift
    - _Requirements: 4.1, 4.6_



- [x] 3. Implement the Validator in `js/app.js`
  - [x] 3.1 Implement `validateForm(name, amount, category)`
    - Return `{ valid: boolean, errors: { name?, amount?, category? } }`
    - `name`: non-empty after trim, max 100 characters
    - `amount`: must be finite, between 0.01 and 999999999.99 inclusive (parse with `parseFloat`)
    - `category`: must be in `CATEGORIES`
    - Return `valid: true` only when all three fields pass
    - _Requirements: 1.1, 1.5, 1.6_



- [x] 4. Implement the State Manager in `js/app.js`
  - [x] 4.1 Implement `transactions` array, `addTransaction`, `deleteTransaction`, `getTransactions`
    - Declare `let transactions = [];` in module scope
    - `addTransaction(name, amount, category)`: prepend a new Transaction object to `transactions`; id format: `String(Date.now()) + '-' + String(Math.random()).slice(2)`, timestamp: `Date.now()`
    - `deleteTransaction(id)`: filter out the entry with matching `id`
    - `getTransactions()`: return a shallow copy (`[...transactions]`)
    - _Requirements: 1.2, 2.5_

  
- [x] 5. Implement the Storage Module in `js/app.js`
  - [x] 5.1 Implement `loadFromStorage()` and `saveToStorage(transactions)`
    - Both functions wrap all `localStorage` access in try/catch
    - `loadFromStorage`: read and `JSON.parse` from `STORAGE_KEY`; if the result is not an array or parsing throws, return `{ data: null, error: true }`; on success return `{ data: parsedArray, error: false }`
    - `saveToStorage(transactions)`: `JSON.stringify` and write to `STORAGE_KEY`; on success return `{ success: true }`; on any exception return `{ success: false }`
    - Do NOT delete the key on parse failure (preserve potentially recoverable data)
    - _Requirements: 1.3, 1.7, 5.1, 5.2, 5.3, 5.4, 5.5_


- [x] 6. Checkpoint — core logic complete
  - Verify `validateForm`, `addTransaction`, `deleteTransaction`, `loadFromStorage`, and `saveToStorage` all behave correctly in isolation. Ask the user if any questions arise before proceeding to the UI layer.

- [x] 7. Implement the Warning Toast in `js/app.js`
  - [x] 7.1 Implement `showWarning(message)`
    - Set the text content of `#warning-toast` to `message` and remove the `hidden` CSS class
    - Attach a click listener to the close button inside the toast that re-adds `hidden`
    - Auto-dismiss after 5000 ms using `setTimeout` (also re-adds `hidden`)
    - _Requirements: 1.7, 5.4, 5.5_

- [x] 8. Implement UI Renderer — Transaction List and Balance in `js/app.js`
  - [x] 8.1 Implement `renderTransactionList(transactions)`
    - Clear `#transaction-list` inner HTML on each call
    - If `transactions` is empty, insert `<li class="empty-msg">No transactions recorded yet.</li>` and return
    - Sort input array descending by `timestamp` before rendering
    - For each transaction render an `<li>` containing: `<span class="tx-name">`, `<span class="tx-amount">` (formatted with `formatCurrency`), `<span class="tx-category">`, and `<button class="btn-delete" data-id="<id>">Delete</button>`
    - Attach `click` delegation on `#transaction-list` to handle delete buttons: call `deleteTransaction(id)`, `saveToStorage`, show toast on save failure, then call `render(getTransactions())`
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_


  - [x] 8.3 Implement `renderBalance(transactions)`
    - Compute the sum using `transactions.reduce((acc, tx) => acc + tx.amount, 0)`, round with `parseFloat(total.toFixed(2))`
    - Update `#balance-display` text content to `formatCurrency(total)`
    - Show `$0.00` when `transactions` is empty
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.7_

- [x] 9. Implement UI Renderer — Chart in `js/app.js`
  - [x] 9.1 Create the Chart.js Pie instance and implement `renderChart(transactions)`
    - Declare `let chartInstance = null;` in module scope
    - On first call (inside an `init` function after DOM is ready), create the chart: `chartInstance = new Chart(document.getElementById('spending-chart'), { type: 'pie', data: {...}, options: {...} })`
    - In `renderChart(transactions)`:
      - If `transactions` is empty: hide `#spending-chart` (add class `hidden`), show `#chart-placeholder` (remove class `hidden`), clear chart data and call `chartInstance.update()`, then return
      - Otherwise: show `#spending-chart`, hide `#chart-placeholder`, call `summarizeByCategory(transactions)` to get summaries, map to `labels`, `data`, and `backgroundColor` arrays (using `CATEGORY_COLORS`), update `chartInstance.data.labels`, `chartInstance.data.datasets[0].data`, `chartInstance.data.datasets[0].backgroundColor`, then call `chartInstance.update()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 10. Implement the main `render()` function and Form submit handler in `js/app.js`
  - [x] 10.1 Implement `render(transactions)` as the single re-render entry point
    - Call `renderTransactionList(transactions)`, `renderBalance(transactions)`, `renderChart(transactions)` in sequence
    - _Requirements: 2.3, 3.3, 4.3_

  - [x] 10.2 Implement the form `submit` event handler
    - Prevent default form submission
    - Clear any existing `<span class="error-msg">` content on all fields
    - Read `#input-name`, `#input-amount`, `#input-category` values
    - Call `validateForm(name, amount, category)`; if `valid: false`, inject `<span class="error-msg">` text under each offending field and return
    - If valid: call `addTransaction(name, parseFloat(amount), category)`, call `saveToStorage(getTransactions())`, show toast if `success: false`, call `render(getTransactions())`, reset the form
    - Clear field-level errors on each field's `input` event
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 10.3 Implement `init()` — app bootstrap on `DOMContentLoaded`
    - Call `loadFromStorage()`; if `error: true`, show toast with storage unavailability message and initialize `transactions = []`; otherwise set `transactions` to the loaded data
    - Create the Chart.js instance (call a `createChart()` helper or inline)
    - Attach the form submit handler
    - Call `render(getTransactions())` to paint the initial state
    - Attach `DOMContentLoaded` listener at the bottom of `js/app.js`
    - _Requirements: 2.2, 3.2, 4.2, 5.3, 5.4_

- [x] 11. Checkpoint — full data flow wired
  - Open `index.html` in a browser. Add a transaction, verify it appears in the list, updates the balance and the chart. Delete it, verify all three components update. Reload and verify data persists. Ask the user if questions arise.

- [x] 12. Style all components in `css/style.css`
  - [x] 12.1 Implement base layout and typography
    - CSS reset (`box-sizing: border-box`, margin/padding zero), `body` font stack, background color, max-width container centered with padding
    - Heading styles for the app title and balance section
    - _Requirements: 6.1, 6.3_

  - [x] 12.2 Style the form and inline error messages
    - Form as a flex column or CSS Grid layout; label + input rows with consistent spacing
    - `input`, `select`, `button[type=submit]` — consistent sizing, border, padding, focus ring
    - `.error-msg` — red color, small font size, displayed below the field
    - _Requirements: 1.1, 6.3_

  - [x] 12.3 Style the Transaction List
    - `#transaction-list` — `overflow-y: auto`, max-height (e.g., `320px`), list-style none
    - `li` items — flex row with name, amount, category badge, and delete button spaced apart
    - `.tx-category` badge — pill shape with background color derived from `CATEGORY_COLORS` (use inline style set by JS or per-category CSS classes)
    - `.btn-delete` — subtle destructive style (red text or icon, no heavy border)
    - `.empty-msg` — centered, muted text
    - _Requirements: 2.1, 2.7_

  - [x] 12.4 Style the Chart section and Warning Toast
    - `#spending-chart` — constrained max width/height (e.g., 300×300px), centered
    - `#chart-placeholder` — centered, muted italic text
    - `.toast` — fixed position (bottom-right or top-center), background warning color, white text, padding, border-radius; `.toast.hidden` sets `display: none`
    - _Requirements: 4.5, 1.7, 5.4_

  - [x] 12.5 Implement responsive breakpoints
    - Mobile-first base styles (single-column layout, full-width inputs)
    - At `min-width: 640px`: two-column layout (form left, list right) or similar side-by-side split
    - At `min-width: 1024px`: optional three-column or wider container
    - Verify no horizontal overflow at 320px viewport width; verify clean layout at 2560px
    - _Requirements: 6.3_

- [x] 13. Final checkpoint — Ensure all tests pass
  - Run any property-based and unit tests. Open `index.html` in Chrome, Firefox, Edge, and Safari. Verify correct rendering at 320px, 768px, 1280px, and 2560px viewport widths. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP. They require a test runner (Jest or Vitest) and `fast-check` to be installed separately, since there is no build step for the app itself.
- Property test tags must follow the format: `// Feature: expense-budget-visualizer, Property N: <property text>`
- The Chart.js instance is created once in `init()` and only updated (never recreated) in subsequent `render()` calls.
- The app runs by opening `index.html` directly in a browser — no server or build command needed.
- All requirements are covered: Req 1 (tasks 3, 10), Req 2 (tasks 8.1, 10), Req 3 (tasks 2.2, 8.3), Req 4 (tasks 2.3, 9.1), Req 5 (tasks 5.1, 10.3), Req 6 (tasks 12, 13), Req 7 (task 1).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1", "4.1", "5.1"] },
    { "id": 3, "tasks": ["2.4", "2.5", "2.6", "3.2", "4.2", "4.3", "5.2", "7.1"] },
    { "id": 4, "tasks": ["8.1", "8.3", "9.1"] },
    { "id": 5, "tasks": ["8.2", "10.1", "10.2"] },
    { "id": 6, "tasks": ["10.3"] },
    { "id": 7, "tasks": ["12.1", "12.2", "12.3", "12.4"] },
    { "id": 8, "tasks": ["12.5"] }
  ]
}
```
