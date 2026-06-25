# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application that allows users to track personal expenses, manage a transaction list, and visualize spending distribution by category using a pie chart. The application runs entirely in the browser with no backend required, using Local Storage for data persistence. It is built with HTML, CSS, and vanilla JavaScript, and can be used as a standalone web page or browser extension.

## Glossary

- **App**: The Expense & Budget Visualizer web application
- **Transaction**: A single expense record consisting of an item name, an amount, and a category
- **Category**: A predefined classification for a transaction; one of: Food, Transport, or Fun
- **Transaction_List**: The scrollable UI component that displays all stored transactions
- **Balance_Display**: The UI component at the top of the page showing the total sum of all transaction amounts
- **Chart**: The pie chart UI component visualizing spending distribution by category
- **Form**: The input form UI component used to add new transactions
- **Storage**: The browser's Local Storage API used to persist transaction data
- **Validator**: The client-side input validation logic within the Form

## Requirements

### Requirement 1: Add a Transaction

**User Story:** As a user, I want to fill in a form with an item name, amount, and category and submit it, so that I can record a new expense.

#### Acceptance Criteria

1. THE Form SHALL include an item name text field (max 100 characters), a numeric amount field accepting values from 0.01 to 999,999,999.99, and a category selector with options: Food, Transport, and Fun.
2. WHEN the user submits the Form with all fields filled and a valid positive numeric amount, THE App SHALL add the Transaction to the Transaction_List.
3. WHEN the user submits the Form with all fields filled and a valid positive numeric amount, THE App SHALL persist the Transaction to Storage.
4. WHEN the user submits the Form with all fields filled and a valid positive numeric amount, THE Form SHALL reset all fields to their default empty or placeholder state.
5. IF the user submits the Form with one or more empty fields, THEN THE Validator SHALL display an inline error message indicating which fields are required, without submitting the Transaction.
6. IF the user submits the Form with a non-positive or non-numeric amount, THEN THE Validator SHALL display an inline error message stating that the amount must be a positive number between 0.01 and 999,999,999.99, without submitting the Transaction.
7. IF Storage is unavailable when the user submits a valid Transaction, THEN THE App SHALL still add the Transaction to the Transaction_List in memory and display a dismissible warning message indicating that the data could not be saved.

---

### Requirement 2: Display and Manage the Transaction List

**User Story:** As a user, I want to see all my recorded transactions in a scrollable list, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all stored transactions sorted in descending order by date added, each showing the item name, amount formatted with a currency symbol and two decimal places, and category.
2. WHEN the App loads, THE Transaction_List SHALL render all transactions previously persisted in Storage.
3. WHEN a new Transaction is added, THE Transaction_List SHALL prepend the new entry at the top of the list without requiring a page reload.
4. THE Transaction_List SHALL provide a delete button for each transaction entry.
5. WHEN the user clicks the delete button for a transaction, THE App SHALL remove that transaction from the Transaction_List immediately without requiring a page reload.
6. WHEN the user clicks the delete button for a transaction, THE App SHALL remove that transaction from Storage.
7. THE Transaction_List SHALL have overflow-y scroll enabled so that all entries remain accessible regardless of list length.
8. IF no transactions exist in Storage, THEN THE Transaction_List SHALL display a message indicating that no transactions have been recorded yet.

---

### Requirement 3: Display Total Balance

**User Story:** As a user, I want to see the total sum of all my expenses displayed at the top of the page, so that I have an immediate overview of my total spending.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all transaction amounts, formatted with a currency symbol and exactly two decimal places (e.g., "$0.00").
2. WHEN the App loads, THE Balance_Display SHALL calculate and render the total from all transactions in Storage.
3. WHEN a Transaction is added, THE Balance_Display SHALL update its value to reflect the new total without requiring a page reload.
4. WHEN a Transaction is deleted, THE Balance_Display SHALL update its value to reflect the new total without requiring a page reload.
5. WHILE no transactions exist, THE Balance_Display SHALL show "$0.00".
6. IF Storage is unavailable at load time, THEN THE Balance_Display SHALL show "$0.00".
7. THE Balance_Display SHALL calculate the total by summing all transaction amounts as decimal values and displaying the result rounded to two decimal places.

---

### Requirement 4: Visualize Spending by Category

**User Story:** As a user, I want to see a pie chart of my spending broken down by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL render a pie chart where each segment's size is proportional to the sum of transaction amounts for that category, including only categories that have at least one transaction.
2. WHEN the App loads, THE Chart SHALL render based on all transactions in Storage.
3. WHEN a Transaction is added, THE Chart SHALL update to reflect the new spending distribution without requiring a page reload.
4. WHEN a Transaction is deleted, THE Chart SHALL update to reflect the new spending distribution without requiring a page reload.
5. WHILE no transactions exist, THE Chart SHALL display a placeholder message stating "No data to display".
6. THE Chart SHALL assign a distinct, fixed color to each category (Food, Transport, Fun) and display the category name and its percentage of total spending as a label for each segment.

---

### Requirement 5: Persist Data Across Sessions

**User Story:** As a user, I want my transactions to be saved between browser sessions, so that I do not lose my spending history when I close and reopen the browser tab.

#### Acceptance Criteria

1. WHEN a Transaction is added, THE App SHALL serialize and write the full transaction dataset to Storage.
2. WHEN a Transaction is deleted, THE App SHALL serialize and write the updated transaction dataset to Storage.
3. WHEN the App loads, THE App SHALL deserialize and read the transaction dataset from Storage to restore the previous session state.
4. IF Storage is unavailable or returns data that cannot be parsed as a valid transaction list, THEN THE App SHALL initialize with an empty transaction dataset and display a dismissible warning message that does not prevent the user from interacting with the rest of the App.
5. IF a Storage write operation fails after adding or deleting a Transaction, THEN THE App SHALL retain the updated transaction dataset in memory and display a dismissible warning message indicating that the data could not be saved persistently.

---

### Requirement 6: Responsive and Performant Interface

**User Story:** As a user, I want the interface to feel fast and work well on different screen sizes, so that I can use the app comfortably on both desktop and mobile browsers.

#### Acceptance Criteria

1. THE App SHALL load and render all UI components within 2 seconds on a modern browser with no network throttling.
2. WHEN the user adds or deletes a transaction, THE App SHALL update the Transaction_List, Balance_Display, and Chart within 100 milliseconds.
3. THE App SHALL render correctly on viewport widths from 320px to 2560px without horizontal overflow or broken layouts.
4. THE App SHALL function correctly on the current stable releases of Chrome, Firefox, Edge, and Safari.

---

### Requirement 7: Single-File Asset Structure

**User Story:** As a developer, I want the project to use exactly one CSS file and one JavaScript file, so that the codebase stays simple and easy to maintain.

#### Acceptance Criteria

1. THE App's HTML entry file SHALL reference exactly one CSS stylesheet located directly within the `css/` directory via a `<link>` tag.
2. THE App's HTML entry file SHALL reference exactly one local JavaScript file located directly within the `js/` directory via a `<script>` tag; CDN-loaded scripts (e.g., Chart.js from a CDN) are not counted toward this limit.
3. THE App SHALL load the Chart.js library either from a CDN `<script>` tag in the HTML or bundled within the single local JavaScript file, without introducing any additional local JavaScript files in the `js/` directory.
4. IF the project contains more than one CSS file in `css/` or more than one local JavaScript file in `js/`, THEN the requirement is considered violated and the additional files SHALL be removed or merged.
