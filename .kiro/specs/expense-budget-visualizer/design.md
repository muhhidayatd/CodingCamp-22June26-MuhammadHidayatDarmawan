# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a fully client-side, single-page web application built with HTML, CSS, and vanilla JavaScript. It allows users to record personal expense transactions, view them in a scrollable list, and see their spending distribution visualized as a pie chart.

All data is persisted using the browser's `localStorage` API — no backend, no build step, no framework. Chart.js is loaded via CDN and used for pie chart rendering. The app can run as a standalone HTML page or be packaged as a browser extension.

### Key Design Decisions

- **No framework**: Vanilla JS keeps the implementation simple, portable, and extension-compatible.
- **Single module file** (`js/app.js`): All JS logic lives in one file, satisfying the single-file constraint and making the app easy to audit.
- **Chart.js via CDN**: Avoids bundling complexity while providing a robust, well-tested chart library.
- **localStorage as source of truth**: The in-memory state is always derived from or kept in sync with `localStorage`. On failure, the app gracefully degrades to in-memory only.
- **Timestamp-based IDs**: Each transaction gets a UUID-style ID (using `Date.now() + Math.random()`) to support reliable deletion without index shifting.

---

## Architecture

The application follows a simple **data-flow architecture** with no reactive framework:

```
User Interaction
      │
      ▼
  [ Form / Delete Button ]
      │
      ▼
  [ Validator ]  ──── (invalid) ──→  [ Inline Error Display ]
      │
      ▼ (valid)
  [ State Manager ]
      │
      ├──→ [ Storage Module ]  ──── (fail) ──→  [ Warning Toast ]
      │
      └──→ [ UI Renderer ]
               ├── Transaction_List
               ├── Balance_Display
               └── Chart (Chart.js)
```

**Flow summary:**
1. User submits the form or clicks delete.
2. The Validator checks inputs; on failure, inline errors are shown.
3. On success, the State Manager updates the in-memory `transactions` array.
4. The Storage Module attempts to persist to `localStorage`; on failure, a dismissible warning toast appears.
5. The UI Renderer re-renders all three components (Transaction_List, Balance_Display, Chart) from the updated state.

All rendering is triggered from a single `render()` function, keeping the UI always consistent with the in-memory state.

---

## Components and Interfaces

### 1. Form Component

**HTML element:** `<form id="transaction-form">`

**Fields:**
- `#input-name` — text input, `maxlength="100"`, required
- `#input-amount` — number input, `min="0.01"`, `max="999999999.99"`, `step="0.01"`, required
- `#input-category` — `<select>` with options: Food, Transport, Fun

**Events:** `submit` event on the form element.

**Validator interface:**

```js
/**
 * Validates form inputs.
 * @param {string} name
 * @param {string} amount
 * @param {string} category
 * @returns {{ valid: boolean, errors: { name?: string, amount?: string, category?: string } }}
 */
function validateForm(name, amount, category)
```

Validation rules:
- `name`: must be non-empty (after trim), max 100 characters
- `amount`: must be a finite number, between 0.01 and 999,999,999.99 inclusive
- `category`: must be one of `['Food', 'Transport', 'Fun']`

Errors are displayed as `<span class="error-msg">` elements inserted below each field.

### 2. State Manager

The in-memory state is a single array held in module scope:

```js
/** @type {Transaction[]} */
let transactions = [];
```

Public interface:

```js
function addTransaction(name, amount, category)   // creates Transaction, prepends to array
function deleteTransaction(id)                    // removes by id
function getTransactions()                        // returns copy of array
```

`addTransaction` assigns:
- `id`: `String(Date.now()) + '-' + String(Math.random()).slice(2)` (unique enough for client-side)
- `timestamp`: `Date.now()` (used for sort order)

### 3. Storage Module

Wraps `localStorage` with try/catch. Key: `'expense-visualizer-transactions'`.

```js
/**
 * Reads and parses transactions from localStorage.
 * @returns {{ data: Transaction[] | null, error: boolean }}
 */
function loadFromStorage()

/**
 * Serializes and writes transactions to localStorage.
 * @param {Transaction[]} transactions
 * @returns {{ success: boolean }}
 */
function saveToStorage(transactions)
```

On parse failure or `localStorage` unavailability, returns `{ data: null, error: true }`.

### 4. UI Renderer

Single entry point:

```js
/**
 * Re-renders all three UI components from current state.
 * Called after every state mutation.
 * @param {Transaction[]} transactions
 */
function render(transactions)
```

Internally delegates to:

```js
function renderTransactionList(transactions)  // updates #transaction-list DOM
function renderBalance(transactions)          // updates #balance-display text
function renderChart(transactions)            // updates Chart.js instance
```

### 5. Transaction List Component

**HTML element:** `<ul id="transaction-list">`

Each item is rendered as an `<li>` with:
- Item name (`<span class="tx-name">`)
- Formatted amount (`<span class="tx-amount">`) — e.g., `$12.50`
- Category badge (`<span class="tx-category">`)
- Delete button (`<button class="btn-delete" data-id="...">`)

Empty state: a single `<li class="empty-msg">No transactions recorded yet.</li>`

Sorted descending by `timestamp` (newest first).

### 6. Balance Display Component

**HTML element:** `<p id="balance-display">` (or `<span>` inside a heading)

Shows: `$0.00` when empty, otherwise the sum of all amounts formatted to 2 decimal places.

```js
/**
 * Formats a number as a USD-style currency string.
 * @param {number} value
 * @returns {string}  e.g. "$1,234.56"
 */
function formatCurrency(value)
```

### 7. Chart Component (Chart.js)

**HTML element:** `<canvas id="spending-chart">`

A Chart.js `Pie` chart instance is created once on load and updated (not recreated) on every render via `chart.data = ...` and `chart.update()`.

When no transactions exist, the canvas is hidden and a `<p id="chart-placeholder">No data to display</p>` element is shown instead.

Category colors (fixed):
| Category  | Color     | Hex       |
|-----------|-----------|-----------|
| Food      | Green     | `#4CAF50` |
| Transport | Blue      | `#2196F3` |
| Fun       | Orange    | `#FF9800` |

### 8. Warning Toast Component

**HTML element:** `<div id="warning-toast" class="toast hidden">`

Shown when `localStorage` fails. Auto-dismisses after 5 seconds or on click of a close button.

```js
/**
 * Shows the warning toast with a given message.
 * @param {string} message
 */
function showWarning(message)
```

---

## Data Models

### Transaction

```js
/**
 * @typedef {Object} Transaction
 * @property {string} id          - Unique identifier
 * @property {string} name        - Item name (1–100 characters, trimmed)
 * @property {number} amount      - Positive decimal (0.01–999,999,999.99)
 * @property {string} category    - 'Food' | 'Transport' | 'Fun'
 * @property {number} timestamp   - Unix ms timestamp (Date.now()) at creation
 */
```

**Storage format:** JSON array of Transaction objects, stored under key `'expense-visualizer-transactions'` in `localStorage`.

Example:
```json
[
  {
    "id": "1718000000000-4823756",
    "name": "Lunch at cafe",
    "amount": 12.50,
    "category": "Food",
    "timestamp": 1718000000000
  }
]
```

### CategorySummary (derived, not stored)

```js
/**
 * @typedef {Object} CategorySummary
 * @property {string} category    - 'Food' | 'Transport' | 'Fun'
 * @property {number} total       - Sum of amounts for this category
 * @property {number} percentage  - Percentage of overall total (0–100)
 */
```

Used transiently to build chart data — never persisted.

```js
/**
 * Computes per-category totals and percentages.
 * @param {Transaction[]} transactions
 * @returns {CategorySummary[]}
 */
function summarizeByCategory(transactions)
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Valid transaction addition grows the list

*For any* valid transaction input (non-empty name ≤ 100 chars, amount between 0.01 and 999,999,999.99, category in {Food, Transport, Fun}), calling `addTransaction` SHALL result in the `transactions` array growing by exactly one entry, and that entry SHALL contain the original name, amount, and category values.

**Validates: Requirements 1.2**

### Property 2: Storage serialization round-trip

*For any* array of valid Transaction objects, serializing the array to Storage via `saveToStorage` and then deserializing via `loadFromStorage` SHALL produce an array that is deep-equal to the original (same ids, names, amounts, categories, and timestamps, in the same order).

**Validates: Requirements 1.3, 5.1, 5.2, 5.3**

### Property 3: Invalid form inputs are always rejected

*For any* combination of form field values where at least one field is empty/blank or the amount is non-positive, non-numeric, or out of range, `validateForm` SHALL return `valid: false` with a non-empty error message for each offending field, and no transaction SHALL be added to the state.

**Validates: Requirements 1.5, 1.6**

### Property 4: Transaction list is always sorted descending by timestamp

*For any* non-empty array of Transaction objects with distinct timestamps, the order of rendered list items SHALL correspond to descending `timestamp` order (newest first).

**Validates: Requirements 2.1, 2.3**

### Property 5: Delete removes a transaction from memory and storage

*For any* non-empty `transactions` array and any valid `id` present in that array, calling `deleteTransaction(id)` followed by `saveToStorage` SHALL result in: (a) the in-memory array no longer containing an entry with that `id`, and (b) a subsequent `loadFromStorage` call also not returning an entry with that `id`.

**Validates: Requirements 2.5, 2.6, 5.2**

### Property 6: Balance display is always the correctly formatted sum

*For any* array of Transaction objects (including the empty array), the value shown by the Balance_Display SHALL equal the sum of all `amount` values, rounded to two decimal places, prefixed with `$` and using comma grouping for thousands. For an empty array the result is always `$0.00`.

**Validates: Requirements 3.1, 3.3, 3.4, 3.5, 3.7**

### Property 7: Category percentages are proportional and exhaustive

*For any* non-empty array of Transaction objects, `summarizeByCategory` SHALL return one entry per category that has at least one transaction, the `total` for each entry SHALL equal the exact sum of amounts for that category, and the `percentage` values SHALL sum to 100 (within floating-point rounding tolerance), with each percentage equal to `(categoryTotal / grandTotal) * 100`.

**Validates: Requirements 4.1, 4.3, 4.4**

### Property 8: Category colors match the fixed color map

*For any* non-empty array of Transaction objects that spans one or more categories, the chart data produced for rendering SHALL assign color `#4CAF50` to Food, `#2196F3` to Transport, and `#FF9800` to Fun — regardless of the order or content of transactions.

**Validates: Requirements 4.6**

---

## Error Handling

### localStorage Unavailability

`localStorage` may be unavailable when:
- The browser is in private/incognito mode with storage blocked
- Storage quota is exceeded
- The page is served from a `file://` origin in certain browsers
- The user has disabled site data storage

All `localStorage` access is wrapped in try/catch inside the Storage Module. On read failure, `loadFromStorage` returns `{ data: null, error: true }` and the app initializes with an empty state, showing the warning toast. On write failure, `saveToStorage` returns `{ success: false }` and the caller shows the warning toast while keeping the in-memory state as the operative state.

### Corrupt Storage Data

If `JSON.parse` throws or the parsed value is not an array, `loadFromStorage` treats it as a failure: returns `{ data: null, error: true }`. The corrupted key is left in storage (not deleted) to avoid data loss on transient parse bugs.

### Inline Validation Errors

`validateForm` performs validation before any state mutation. Errors are rendered as `<span class="error-msg">` next to each invalid field, and the form `submit` handler returns early without calling `addTransaction`. Errors are cleared on the next submit attempt or on field input events.

### Floating-Point Arithmetic

JavaScript `Number` can accumulate floating-point errors when summing many decimal amounts. To keep the balance accurate to two decimal places, the sum is computed as:

```js
const total = transactions.reduce((acc, tx) => acc + tx.amount, 0);
const display = parseFloat(total.toFixed(2));
```

This rounds to 2 decimal places consistently before display and chart computation.

---

## Testing Strategy

### Unit Tests (example-based)

Unit tests cover specific examples, edge cases, and error conditions:

- **Validator**: test each invalid input class (empty name, whitespace-only name, amount = 0, amount = -1, amount = "abc", amount > max, missing category)
- **formatCurrency**: test edge values ($0.00, $0.01, $999,999,999.99, values requiring rounding)
- **summarizeByCategory**: test with single category, multiple categories, empty array
- **loadFromStorage**: test with mocked invalid JSON, unavailable localStorage, valid data
- **saveToStorage**: test with mocked localStorage throwing quota exceeded
- **renderTransactionList**: test empty state message, single item, multiple items
- **renderBalance**: test empty state ($0.00), single item, multiple items
- **Chart empty state**: canvas hidden + placeholder shown when no transactions

### Property-Based Tests

Property-based tests use [fast-check](https://github.com/dubzzz/fast-check) (a well-maintained JS PBT library). Each property test runs a minimum of **100 iterations**.

Each test is tagged with:
```
// Feature: expense-budget-visualizer, Property N: <property text>
```

**Property 1 — Valid transaction addition grows the list**
- Generator: random `name` (1–100 printable chars), `amount` (float in [0.01, 999999999.99]), `category` (one of the 3 values)
- Assert: `transactions.length` increases by 1; the new entry matches input values

**Property 2 — Storage serialization round-trip**
- Generator: random arrays of 0–50 valid Transaction objects
- Assert: `loadFromStorage(saveToStorage(txs))` deep-equals input array

**Property 3 — Invalid form inputs are always rejected**
- Generator: random field combinations with at least one invalid field (empty strings, amounts ≤ 0, amounts > max, NaN strings)
- Assert: `validateForm` returns `valid: false`; `errors` contains message for each invalid field

**Property 4 — Transaction list sorted descending by timestamp**
- Generator: arrays of 1–20 transactions with random distinct timestamps
- Assert: rendered `<li>` elements appear in descending timestamp order

**Property 5 — Delete removes from memory and storage**
- Generator: array of 1–20 valid transactions; randomly pick one id to delete
- Assert: after delete + save, in-memory array and reloaded storage array both lack the deleted id

**Property 6 — Balance display is the correctly formatted sum**
- Generator: arrays of 0–50 transactions with random amounts
- Assert: displayed balance string equals `formatCurrency(sum rounded to 2dp)`

**Property 7 — Category percentages are proportional and exhaustive**
- Generator: arrays of 1–30 transactions with random categories and amounts
- Assert: each category's `percentage` equals `(categoryTotal / grandTotal) * 100`; all percentages sum to 100 ± 0.001

**Property 8 — Category colors match fixed map**
- Generator: random non-empty transaction arrays across any subset of categories
- Assert: chart data color for each present category matches the defined constant

### Integration / Smoke Tests

- Load the app with pre-populated localStorage and verify all three components render correctly
- Verify the HTML references exactly one `css/` stylesheet and one `js/` file
- Verify Chart.js loads from CDN and the chart canvas is present on load
