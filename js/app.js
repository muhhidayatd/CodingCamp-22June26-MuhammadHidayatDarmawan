'use strict';

// =============================================================================
// Data Model — Constants and Types
// =============================================================================

/** @type {string} localStorage key for persisting transactions */
const STORAGE_KEY = 'expense-visualizer-transactions';

/** Fixed colors per category, used by the pie chart */
const CATEGORY_COLORS = {
  Food: '#4CAF50',
  Transport: '#2196F3',
  Fun: '#FF9800',
};

/** Ordered list of valid category names */
const CATEGORIES = ['Food', 'Transport', 'Fun'];

/**
 * @typedef {Object} Transaction
 * @property {string} id         - Unique identifier (timestamp + random digits)
 * @property {string} name       - Item name (1–100 characters, trimmed)
 * @property {number} amount     - Positive decimal (0.01–999,999,999.99)
 * @property {string} category   - 'Food' | 'Transport' | 'Fun'
 * @property {number} timestamp  - Unix ms timestamp (Date.now()) at creation
 */

// =============================================================================
// State Manager
// =============================================================================

/** @type {Transaction[]} */
let transactions = [];

/**
 * Creates a new Transaction and prepends it to the transactions array.
 *
 * @param {string} name
 * @param {number} amount
 * @param {string} category
 */
function addTransaction(name, amount, category) {
  const id = String(Date.now()) + '-' + String(Math.random()).slice(2);
  const timestamp = Date.now();
  /** @type {Transaction} */
  const transaction = { id, name, amount, category, timestamp };
  transactions = [transaction, ...transactions];
}

/**
 * Removes the transaction with the given id from the transactions array.
 *
 * @param {string} id
 */
function deleteTransaction(id) {
  transactions = transactions.filter((tx) => tx.id !== id);
}

/**
 * Returns a shallow copy of the current transactions array.
 *
 * @returns {Transaction[]}
 */
function getTransactions() {
  return [...transactions];
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Formats a number as a USD currency string.
 *
 * Examples:
 *   formatCurrency(0)             → "$0.00"
 *   formatCurrency(1234.56)       → "$1,234.56"
 *   formatCurrency(999999999.99)  → "$999,999,999.99"
 *
 * @param {number} value
 * @returns {string}
 */
function formatCurrency(value) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/**
 * @typedef {Object} CategorySummary
 * @property {string} category   - 'Food' | 'Transport' | 'Fun'
 * @property {number} total      - Sum of amounts for this category
 * @property {number} percentage - Share of overall total (0–100)
 */

/**
 * Groups transactions by category and computes each category's total and
 * percentage share of the overall spend.
 *
 * - Returns only categories that have at least one transaction.
 * - Returns [] for an empty input array.
 * - Grand total is rounded via parseFloat(total.toFixed(2)) to avoid
 *   floating-point drift before the percentage calculation.
 *
 * @param {Transaction[]} transactions
 * @returns {CategorySummary[]}
 */
function summarizeByCategory(transactions) {
  if (transactions.length === 0) {
    return [];
  }

  // Accumulate totals per category
  /** @type {Object.<string, number>} */
  const totalsMap = {};
  for (const tx of transactions) {
    totalsMap[tx.category] = (totalsMap[tx.category] || 0) + tx.amount;
  }

  // Round grand total to avoid floating-point drift
  const rawGrandTotal = Object.values(totalsMap).reduce((acc, t) => acc + t, 0);
  const grandTotal = parseFloat(rawGrandTotal.toFixed(2));

  // Build result array, preserving CATEGORIES order for consistent chart output
  return CATEGORIES
    .filter((cat) => totalsMap[cat] !== undefined)
    .map((cat) => {
      const total = parseFloat(totalsMap[cat].toFixed(2));
      const percentage = (total / grandTotal) * 100;
      return { category: cat, total, percentage };
    });
}

// =============================================================================
// Validator
// =============================================================================

/**
 * Validates the three form fields before a transaction is created.
 *
 * Rules:
 *   - name    : non-empty after trim, max 100 characters
 *   - amount  : parsed with parseFloat, must be finite, in [0.01, 999999999.99]
 *   - category: must be one of CATEGORIES
 *
 * @param {string} name
 * @param {string} amount
 * @param {string} category
 * @returns {{ valid: boolean, errors: { name?: string, amount?: string, category?: string } }}
 */
function validateForm(name, amount, category) {
  const errors = {};

  // --- name validation ---
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (trimmedName.length === 0) {
    errors.name = 'Item name is required.';
  } else if (trimmedName.length > 100) {
    errors.name = 'Item name must be 100 characters or fewer.';
  }

  // --- amount validation ---
  const parsedAmount = parseFloat(amount);
  if (!isFinite(parsedAmount) || parsedAmount < 0.01 || parsedAmount > 999999999.99) {
    errors.amount = 'Amount must be a positive number between 0.01 and 999,999,999.99.';
  }

  // --- category validation ---
  if (!CATEGORIES.includes(category)) {
    errors.category = 'Please select a valid category (Food, Transport, or Fun).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// =============================================================================
// Storage Module
// =============================================================================

/**
 * Reads and parses the transaction array from localStorage.
 *
 * - Returns `{ data: Transaction[], error: false }` on success.
 * - Returns `{ data: null, error: true }` if localStorage is unavailable,
 *   JSON.parse throws, or the parsed value is not an array.
 * - Does NOT delete the storage key on failure, preserving potentially
 *   recoverable data.
 *
 * @returns {{ data: Transaction[] | null, error: boolean }}
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Key not set yet — treat as empty, not an error
    if (raw === null) {
      return { data: [], error: false };
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { data: null, error: true };
    }
    return { data: parsed, error: false };
  } catch (_e) {
    return { data: null, error: true };
  }
}

/**
 * Serializes the transaction array and writes it to localStorage.
 *
 * - Returns `{ success: true }` if the write succeeds.
 * - Returns `{ success: false }` on any exception (quota exceeded,
 *   storage blocked, etc.).
 *
 * @param {Transaction[]} transactions
 * @returns {{ success: boolean }}
 */
function saveToStorage(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return { success: true };
  } catch (_e) {
    return { success: false };
  }
}

// =============================================================================
// Warning Toast
// =============================================================================

/**
 * Shows the warning toast with the given message.
 *
 * - Sets the text of `.toast-message` inside `#warning-toast`.
 * - Removes the `hidden` class to make the toast visible.
 * - Attaches a one-time click listener to the `.toast-close` button that
 *   re-adds `hidden`.
 * - Auto-dismisses after 5000 ms by re-adding `hidden`.
 *
 * Requirements 1.7, 5.4, 5.5
 *
 * @param {string} message - The warning text to display in the toast.
 */
function showWarning(message) {
  const toast = document.getElementById('warning-toast');
  if (!toast) return;

  const messageEl = toast.querySelector('.toast-message');
  const closeBtn = toast.querySelector('.toast-close');

  if (messageEl) {
    messageEl.textContent = message;
  }

  toast.classList.remove('hidden');

  // Auto-dismiss after 5 seconds
  const timerId = setTimeout(() => {
    toast.classList.add('hidden');
  }, 5000);

  // Close button dismisses immediately and cancels the auto-dismiss timer
  if (closeBtn) {
    const onClose = () => {
      clearTimeout(timerId);
      toast.classList.add('hidden');
      closeBtn.removeEventListener('click', onClose);
    };
    closeBtn.addEventListener('click', onClose);
  }
}
    
// =============================================================================
// UI Renderer — Transaction List
// =============================================================================

/**
 * Renders the transaction list into `#transaction-list`.
 *
 * - Clears existing content on every call.
 * - Shows an empty-state message when `transactions` is empty.
 * - Sorts the input array descending by `timestamp` (newest first) before
 *   rendering — the original array is NOT mutated.
 * - Each `<li>` contains: item name, formatted amount, category badge, and a
 *   delete button with `data-id` set to the transaction id.
 *
 * Requirements 2.1, 2.3, 2.4, 2.8
 *
 * @param {Transaction[]} transactions
 */
function renderTransactionList(transactions) {
  const list = document.getElementById('transaction-list');
  if (!list) return;

  // Clear previous content
  list.innerHTML = '';

  // Empty state
  if (transactions.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-msg';
    emptyItem.textContent = 'No transactions recorded yet.';
    list.appendChild(emptyItem);
    return;
  }

  // Sort descending by timestamp (newest first); do not mutate the input array
  const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp);

  for (const tx of sorted) {
    const li = document.createElement('li');

    const nameSpan = document.createElement('span');
    nameSpan.className = 'tx-name';
    nameSpan.textContent = tx.name;

    const amountSpan = document.createElement('span');
    amountSpan.className = 'tx-amount';
    amountSpan.textContent = formatCurrency(tx.amount);

    const categorySpan = document.createElement('span');
    categorySpan.className = 'tx-category';
    categorySpan.dataset.category = tx.category;
    categorySpan.textContent = tx.category;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.dataset.id = tx.id;
    deleteBtn.textContent = 'Delete';

    li.appendChild(nameSpan);
    li.appendChild(amountSpan);
    li.appendChild(categorySpan);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  }
}

// =============================================================================
// UI Renderer — Balance Display
// =============================================================================

/**
 * Renders the total balance into `#balance-display`.
 *
 * - Sums all transaction amounts using `reduce`.
 * - Rounds the result to 2 decimal places via `parseFloat(total.toFixed(2))`
 *   to avoid floating-point drift.
 * - Updates `#balance-display` text content with `formatCurrency(total)`.
 * - Shows `$0.00` when `transactions` is empty.
 *
 * Requirements 3.1, 3.3, 3.4, 3.5, 3.7
 *
 * @param {Transaction[]} transactions
 */
function renderBalance(transactions) {
  const display = document.getElementById('balance-display');
  if (!display) return;

  const raw = transactions.reduce((acc, tx) => acc + tx.amount, 0);
  const total = parseFloat(raw.toFixed(2));

  display.textContent = formatCurrency(total);
}

// =============================================================================
// UI Renderer — Chart
// =============================================================================

/** @type {import('chart.js').Chart | null} */
let chartInstance = null;

/**
 * Creates and stores a Chart.js Pie chart instance on the `#spending-chart`
 * canvas element. Called once during app initialisation.
 *
 * Requirements 4.1, 4.6
 */
function createChart() {
  const canvas = document.getElementById('spending-chart');
  if (!canvas) return;

  chartInstance = new Chart(canvas, {
    type: 'pie',
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((acc, v) => acc + v, 0);
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              return `${label}: ${formatCurrency(value)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

/**
 * Updates the Chart.js pie chart to reflect the current transaction data.
 *
 * - If `transactions` is empty: hides `#spending-chart`, shows
 *   `#chart-placeholder`, clears chart data, and calls `chartInstance.update()`.
 * - If `transactions` is non-empty: shows `#spending-chart`, hides
 *   `#chart-placeholder`, computes per-category summaries via
 *   `summarizeByCategory`, maps them to labels / data / backgroundColor arrays
 *   using `CATEGORY_COLORS`, updates `chartInstance.data`, and calls
 *   `chartInstance.update()`.
 *
 * Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 *
 * @param {Transaction[]} transactions
 */
function renderChart(transactions) {
  const canvas = document.getElementById('spending-chart');
  const placeholder = document.getElementById('chart-placeholder');

  if (transactions.length === 0) {
    // Hide chart, show placeholder
    if (canvas) canvas.classList.add('hidden');
    if (placeholder) placeholder.classList.remove('hidden');

    // Clear chart data so it is ready for next render
    if (chartInstance) {
      chartInstance.data.labels = [];
      chartInstance.data.datasets[0].data = [];
      chartInstance.data.datasets[0].backgroundColor = [];
      chartInstance.update();
    }
    return;
  }

  // Show chart, hide placeholder
  if (canvas) canvas.classList.remove('hidden');
  if (placeholder) placeholder.classList.add('hidden');

  const summaries = summarizeByCategory(transactions);

  const labels = summaries.map((s) => s.category);
  const data = summaries.map((s) => s.total);
  const backgroundColor = summaries.map((s) => CATEGORY_COLORS[s.category]);

  if (chartInstance) {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = data;
    chartInstance.data.datasets[0].backgroundColor = backgroundColor;
    chartInstance.update();
  }
}

// =============================================================================
// UI Renderer — Main Entry Point
// =============================================================================

/**
 * Re-renders all three UI components from the current transaction state.
 *
 * This is the single entry point for all UI updates. Call it after every
 * state mutation (add or delete) to keep the UI consistent with in-memory state.
 *
 * Requirements 2.3, 3.3, 4.3
 *
 * @param {Transaction[]} transactions
 */
function render(transactions) {
  renderTransactionList(transactions);
  renderBalance(transactions);
  renderChart(transactions);
}

// =============================================================================
// Form Handler
// =============================================================================

/**
 * Attaches event listeners to the transaction form.
 *
 * 1. `submit` listener:
 *    - Prevents default form submission.
 *    - Clears all existing `.error-msg` content.
 *    - Reads field values from `#input-name`, `#input-amount`, `#input-category`.
 *    - Calls `validateForm`; on failure, injects inline error messages and returns.
 *    - On success: calls `addTransaction`, persists via `saveToStorage`,
 *      shows a warning toast if the save fails, re-renders via `render`, and
 *      resets the form.
 *
 * 2. `input` listeners on each field:
 *    - Clears the sibling `.error-msg` span when the user types.
 *
 * Call this ONCE during app initialisation (from `init`).
 *
 * Requirements 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */
function attachFormHandler() {
  const form = document.getElementById('transaction-form');
  if (!form) return;

  const nameInput     = document.getElementById('input-name');
  const amountInput   = document.getElementById('input-amount');
  const categoryInput = document.getElementById('input-category');

  // ── Helper: clear the `.error-msg` span that follows a given input ──────
  /**
   * @param {HTMLElement} field
   */
  function clearFieldError(field) {
    if (!field) return;
    const errorSpan = field.parentElement && field.parentElement.querySelector('.error-msg');
    if (errorSpan) {
      errorSpan.textContent = '';
    }
  }

  // ── Helper: show an error message next to a field ───────────────────────
  /**
   * @param {HTMLElement} field
   * @param {string} message
   */
  function showFieldError(field, message) {
    if (!field) return;
    const errorSpan = field.parentElement && field.parentElement.querySelector('.error-msg');
    if (errorSpan) {
      errorSpan.textContent = message;
    }
  }

  // ── Submit listener ──────────────────────────────────────────────────────
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Clear all existing error messages before re-validating
    clearFieldError(nameInput);
    clearFieldError(amountInput);
    clearFieldError(categoryInput);

    // Read current field values
    const name     = nameInput     ? nameInput.value     : '';
    const amount   = amountInput   ? amountInput.value   : '';
    const category = categoryInput ? categoryInput.value : '';

    // Validate inputs
    const { valid, errors } = validateForm(name, amount, category);

    if (!valid) {
      // Inject inline error messages for each offending field
      if (errors.name)     showFieldError(nameInput,     errors.name);
      if (errors.amount)   showFieldError(amountInput,   errors.amount);
      if (errors.category) showFieldError(categoryInput, errors.category);
      return;
    }

    // Add the transaction to in-memory state
    addTransaction(name.trim(), parseFloat(amount), category);

    // Persist to storage; warn the user if it fails
    const result = saveToStorage(getTransactions());
    if (!result.success) {
      showWarning('Your transaction was added but could not be saved to storage. Data is kept in memory only.');
    }

    // Re-render all UI components
    render(getTransactions());

    // Reset the form to its default state
    form.reset();
  });

  // ── Input listeners — clear field error as the user types ───────────────
  if (nameInput) {
    nameInput.addEventListener('input', () => clearFieldError(nameInput));
  }
  if (amountInput) {
    amountInput.addEventListener('input', () => clearFieldError(amountInput));
  }
  if (categoryInput) {
    categoryInput.addEventListener('input', () => clearFieldError(categoryInput));
  }
}

// =============================================================================
// Event Delegation — Delete Buttons
// =============================================================================

/**
 * Attaches a single delegated `click` listener on `#transaction-list` to
 * handle delete button clicks.
 *
 * Call this ONCE during app initialisation (from `init`).
 *
 * When a `.btn-delete` button is clicked:
 *   1. Removes the transaction from in-memory state via `deleteTransaction`.
 *   2. Persists the updated state via `saveToStorage`.
 *   3. Shows a warning toast if the save fails.
 *   4. Re-renders the full UI via `render(getTransactions())`.
 *
 * Requirements 2.5, 2.6
 */
function attachListDelegation() {
  const list = document.getElementById('transaction-list');
  if (!list) return;

  list.addEventListener('click', (event) => {
    const btn = event.target.closest('.btn-delete');
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    deleteTransaction(id);

    const result = saveToStorage(getTransactions());
    if (!result.success) {
      showWarning('Your changes could not be saved to storage. Data is kept in memory only.');
    }

    render(getTransactions());
  });
}
function toggleTheme() {

  document.body.classList.toggle('dark');

  const isDark =
    document.body.classList.contains('dark');

  localStorage.setItem(
    'theme',
    isDark ? 'dark' : 'light'
  );

  updateThemeButton();
}

function updateThemeButton() {

  const button =
    document.getElementById(
      'theme-toggle'
    );

  if (!button) return;

  button.textContent =
    document.body.classList.contains('dark')
      ? '☀️ Light Mode'
      : '🌙 Dark Mode';
}
// =============================================================================
// App Bootstrap — init
// =============================================================================

/**
 * Bootstraps the application:
 *   1. Loads persisted transactions from localStorage; shows a warning toast
 *      and keeps `transactions = []` if storage is unavailable.
 *   2. Creates the Chart.js instance.
 *   3. Attaches the form submit handler.
 *   4. Attaches the delete-button delegation listener.
 *   5. Renders the initial UI state.
 *
 * Requirements 2.2, 3.2, 4.2, 5.3, 5.4
 */


function init() {
  // 1. Load from storage
  const result = loadFromStorage();
  if (result.error) {
    showWarning('Storage is unavailable. Your data won\'t be saved between sessions.');
    transactions = [];
  } else {
    transactions = result.data;
  }

  // 2. Create Chart.js instance
  createChart();

  // 3. Wire up the add-transaction form
  attachFormHandler();

  // 4. Wire up delete-button delegation
  attachListDelegation();
const themeButton =
  document.getElementById(
    'theme-toggle'
  );

const savedTheme =
  localStorage.getItem(
    'theme'
  );

if (savedTheme === 'dark') {
  document.body.classList.add(
    'dark'
  );
}

updateThemeButton();

if (themeButton) {
  themeButton.addEventListener(
    'click',
    toggleTheme
  );
}
  // 5. Paint the initial UI
  render(getTransactions());

}


document.addEventListener('DOMContentLoaded', init);
