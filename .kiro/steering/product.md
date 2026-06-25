# Product: Expense & Budget Visualizer

A client-side personal expense tracker that lets users log transactions, view their spending history, and see a pie chart breakdown by category.

## Core Features

- Add transactions with a name, amount, and category (Food, Transport, Fun)
- View all transactions in a scrollable, newest-first list with per-item delete
- See a running total balance updated in real time
- Visualize spending distribution with a Chart.js pie chart
- Data persists across browser sessions via `localStorage` — no backend required

## Target Users

Individual users tracking personal spending directly in their browser, on desktop or mobile.

## Constraints

- No authentication, no server, no build step
- Runs as a standalone HTML page or browser extension
- Must work on Chrome, Firefox, Edge, and Safari (current stable releases)
- Viewport support: 320px to 2560px
