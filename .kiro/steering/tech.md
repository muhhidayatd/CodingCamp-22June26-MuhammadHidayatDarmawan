# Tech Stack

## Core Technologies

- **HTML5** — single entry file (`index.html`)
- **CSS3** — one stylesheet (`css/style.css`)
- **Vanilla JavaScript (ES6+)** — one module file (`js/app.js`), no framework
- **Chart.js** — loaded via CDN for pie chart rendering
- **localStorage** — browser API for data persistence

## Key Libraries

| Library  | Source | Purpose            |
|----------|--------|--------------------|
| Chart.js | CDN    | Pie chart rendering |

No npm, no bundler, no transpiler. The app runs directly in the browser without any build step.

## Single-File Constraint

- Exactly **one** CSS file in `css/`
- Exactly **one** local JS file in `js/`
- CDN scripts (Chart.js) do not count toward the JS file limit

## Testing

Property-based tests use **fast-check** for correctness properties. Unit tests cover validators, formatters, and renderers.

Test tags follow this format:
```
// Feature: expense-budget-visualizer, Property N: <property text>
```

## Common Commands

Since there is no build step, open `index.html` directly in a browser.

For tests (when a test runner is set up):
```bash
# Run unit + property-based tests (single pass, no watch)
npx jest --runInBand

# Or with vitest
npx vitest --run
```

## Browser Support

Chrome, Firefox, Edge, Safari — current stable releases only.
